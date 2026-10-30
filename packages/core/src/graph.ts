/** @since 0.1.0 */

import type {RulePlan, RuleProgram} from "./compile.ts";
import type {WhuiyEffect, WriteAddress} from "./operation.ts";
import type {RuntimeRule, RuleFailure, RuntimeRuleHandler} from "./rules.ts";
import type {
  DefinitionName,
  DefinitionOf,
  ExpandAlias,
  LiveToken,
  TokenDefinitionRef,
  TokenInstanceRef,
  TokenRoot,
  TokenValue,
  TokenValueState,
  ValueOf,
} from "./token.ts";

import {Cause, Effect, Exit, Match, PubSub, Stream, SubscriptionRef} from "effect";

import {OperationWritesId} from "./operation.ts";
import {
  expandRoot,
  getDetachedNegativeDefinitions,
  getDetachedRelations,
  getDetachedValue,
  isSingleDefinition,
  isTokenDefinition,
} from "./token.ts";

type RelationWrite<
  Terms extends readonly TokenRoot[],
  Root extends string,
  Path extends readonly string[],
> = WriteAddress<
  Root,
  Path,
  {
    readonly definition: DefinitionName<DefinitionOf<ExpandAlias<Terms[number]>>>;
    readonly kind: "relation";
  }
>;

interface LiveNode {
  readonly blueprint: TokenInstanceRef;
  readonly incoming: Set<LiveNode>;
  readonly outgoing: LiveNode[];
  rootReferences: number;
  valueState: TokenValueState;
}

/** @internal */
function withoutStackTrace(cause: Cause.Cause<never>): Cause.Cause<never> {
  return Cause.fromReasons(
    cause.reasons.map(reason =>
      Match.value(reason).pipe(
        Match.when({_tag: "Die"}, reason => Cause.makeDieReason(reason.defect)),
        Match.when({_tag: "Fail"}, reason => Cause.makeFailReason(reason.error)),
        Match.when({_tag: "Interrupt"}, reason => Cause.makeInterruptReason(reason.fiberId)),
        Match.exhaustive,
      ),
    ),
  );
}

interface GraphState {
  changed: boolean;
  readonly changedNodes: Set<LiveNode>;
  draining: boolean;
  readonly nodes: Map<TokenInstanceRef, LiveNode>;
  pendingRuleScan: boolean;
  readonly rules: RuleTracker;
}

/**
 * One completed graph mutation delivered to {@link Mount.changes}.
 *
 * **When to use**
 *
 * Renderers patch only the reported tokens instead of re-walking the whole tree.
 * Dirty child tokens share an id with the node that owns their text or props.
 *
 * @since 0.4.0
 * @category Models
 */
export type GraphChange =
  | {readonly kind: "initial"}
  | {readonly kind: "update"; readonly tokens: readonly LiveToken[]};

interface RuleEntry {
  readonly node: LiveNode;
  readonly rule: RuntimeRule;
}

/**
 * Roots retained by a Whuiy runtime.
 *
 * **When to use**
 *
 * Keep this value for as long as a mounted graph branch should remain live.
 * Run {@link Mount.release} when the caller no longer owns the branch.
 *
 * @since 0.2.0
 * @category Models
 */
export interface Mount {
  readonly roots: readonly LiveToken[];
  /** Emits once immediately, then after each complete outer graph mutation. */
  readonly changes: Stream.Stream<GraphChange>;
  /** Releases this mount once and recursively removes orphaned branches. */
  readonly release: Effect.Effect<void>;
}

/**
 * Executes and observes one configured Whuiy graph.
 *
 * **When to use**
 *
 * Allocate a runtime from {@link Whuiy.make}, mount token roots through it,
 * and consume {@link WhuiyRuntime.ruleFailures} when an adapter needs to
 * report failed rule invocations.
 *
 * @since 0.2.0
 * @category Models
 */
export interface WhuiyRuntime {
  /** Mounts token roots and returns their live handles. */
  readonly mount: (...roots: readonly TokenRoot[]) => Effect.Effect<Mount>;
  /** Broadcasts one event for every failed synchronous rule invocation. */
  readonly ruleFailures: Stream.Stream<RuleFailure>;
  /**
   * Calls `listener` synchronously after every completed mutation.
   *
   * Adapters that patch real DOM want this instead of `Mount.changes`: there is
   * no fiber hop, so a write is visible before the writing effect returns.
   */
  readonly subscribe: (listener: (change: GraphChange) => void) => () => void;
}

/** @internal */
interface RuntimeOperations {
  readonly add: (node: LiveNode, roots: readonly TokenRoot[]) => void;
  readonly del: (node: LiveNode, roots: readonly TokenRoot[]) => void;
  readonly findRelated: (
    node: LiveNode,
    target: TokenDefinitionRef | TokenInstanceRef,
  ) => readonly LiveNode[];
  readonly handle: <Root extends string, Path extends readonly string[]>(
    node: LiveNode,
    root: Root,
    path: Path,
  ) => LiveToken<TokenDefinitionRef, Root, Path>;
  readonly set: (node: LiveNode, roots: readonly TokenRoot[]) => void;
  readonly setValue: (node: LiveNode, value: TokenValue) => void;
}

const operationRuns = new WeakMap<object, () => void>();

function makeOperation<Writes extends WriteAddress>(options: {
  readonly run: () => void;
  readonly writes: Writes;
}): WhuiyEffect<void, Writes> {
  const effect = Effect.sync(options.run);
  operationRuns.set(effect, options.run);
  // SAFETY: `WhuiyEffect` only augments Effect with this exact write marker.
  return Object.assign(effect, {[OperationWritesId]: options.writes}) as WhuiyEffect<void, Writes>;
}

function definitionsConflict(left: TokenDefinitionRef, right: TokenDefinitionRef): boolean {
  return left.excludedDefinitions.includes(right) || right.excludedDefinitions.includes(left);
}

class MountImpl implements Mount {
  readonly changes: Stream.Stream<GraphChange>;
  readonly release: Effect.Effect<void>;
  readonly roots: readonly LiveToken[];

  constructor(options: {
    readonly changes: Stream.Stream<GraphChange>;
    readonly release: Effect.Effect<void>;
    readonly roots: readonly LiveToken[];
  }) {
    this.changes = options.changes;
    this.release = options.release;
    this.roots = options.roots;
  }
}

class LiveTokenImpl<
  Definition extends TokenDefinitionRef,
  Root extends string,
  Path extends readonly string[],
> implements LiveToken<Definition, Root, Path> {
  readonly definition: Definition;
  readonly id: number;
  readonly #node: LiveNode;
  readonly #path: Path;
  readonly #root: Root;
  readonly #runtime: RuntimeOperations;

  constructor(options: {
    readonly node: LiveNode;
    readonly path: Path;
    readonly root: Root;
    readonly runtime: RuntimeOperations;
  }) {
    this.#node = options.node;
    this.#path = options.path;
    this.#root = options.root;
    this.#runtime = options.runtime;
    // SAFETY: every handle is created from the definition selected by its typed construction path.
    this.definition = options.node.blueprint.definition as Definition;
    this.id = options.node.blueprint.id;
  }

  #related(node: LiveNode): LiveToken<TokenDefinitionRef, Root, readonly string[]> {
    return this.#runtime.handle(node, this.#root, [...this.#path, node.blueprint.definition.name]);
  }

  add<const Terms extends readonly TokenRoot[]>(
    ...terms: Terms
  ): WhuiyEffect<void, WriteAddress<Root, Path, {readonly kind: "relations"}>> {
    return makeOperation({
      run: () => this.#runtime.add(this.#node, terms),
      writes: {path: this.#path, root: this.#root, slot: {kind: "relations"}},
    });
  }

  all<Target extends TokenDefinitionRef>(
    target: Target,
  ): readonly LiveToken<Target, Root, readonly [...Path, DefinitionName<Target>]>[];
  all<Pattern extends TokenInstanceRef>(
    pattern: Pattern,
  ): readonly LiveToken<
    DefinitionOf<Pattern>,
    Root,
    readonly [...Path, DefinitionName<DefinitionOf<Pattern>>]
  >[];
  all(
    target: TokenDefinitionRef | TokenInstanceRef,
  ): readonly LiveToken<TokenDefinitionRef, Root, readonly string[]>[] {
    return this.#runtime.findRelated(this.#node, target).map(node => this.#related(node));
  }

  del<const Terms extends readonly TokenRoot[]>(
    ...terms: Terms
  ): WhuiyEffect<void, RelationWrite<Terms, Root, Path>> {
    // SAFETY: every joined name is derived from one of `Terms`.
    const definition = terms
      .map(term => expandRoot(term).definition.name)
      .join("|") as DefinitionName<DefinitionOf<ExpandAlias<Terms[number]>>>;
    return makeOperation({
      run: () => this.#runtime.del(this.#node, terms),
      writes: {path: this.#path, root: this.#root, slot: {definition, kind: "relation"}},
    });
  }

  get<Target extends TokenDefinitionRef>(
    target: Target,
  ): LiveToken<Target, Root, readonly [...Path, DefinitionName<Target>]>;
  get<Pattern extends TokenInstanceRef>(
    pattern: Pattern,
  ): LiveToken<
    DefinitionOf<Pattern>,
    Root,
    readonly [...Path, DefinitionName<DefinitionOf<Pattern>>]
  >;
  get(
    target: TokenDefinitionRef | TokenInstanceRef,
  ): LiveToken<TokenDefinitionRef, Root, readonly string[]> {
    const definition = targetDefinition(target);
    const related = this.#runtime.findRelated(this.#node, target);
    if (related.length === 0)
      throw new Error(
        `Token ${this.definition.name}#${this.id} has no ${definition.name} relation`,
      );
    if (related.length > 1)
      throw new Error(
        `Token ${this.definition.name}#${this.id} has ${related.length} ${definition.name} relations; use all(${definition.name}) or add a guard token`,
      );
    // SAFETY: the selected node's definition is `definition`, the target's definition.
    return this.#related(related[0]!) as LiveToken<TokenDefinitionRef, Root, readonly string[]>;
  }

  hasValue(): boolean {
    return this.#node.valueState.kind === "present";
  }
  pipe<Result>(operation: (token: this) => Result): Result {
    return operation(this);
  }

  set<const Terms extends readonly TokenRoot[]>(
    ...terms: Terms
  ): WhuiyEffect<void, WriteAddress<Root, Path, {readonly kind: "relations"}>> {
    return makeOperation({
      run: () => this.#runtime.set(this.#node, terms),
      writes: {path: this.#path, root: this.#root, slot: {kind: "relations"}},
    });
  }

  setValue(
    value: ValueOf<Definition>,
  ): WhuiyEffect<void, WriteAddress<Root, Path, {readonly kind: "value"}>> {
    return makeOperation({
      run: () => this.#runtime.setValue(this.#node, value),
      writes: {path: this.#path, root: this.#root, slot: {kind: "value"}},
    });
  }

  tokens(): readonly LiveToken[] {
    return this.#node.outgoing.map(node =>
      this.#runtime.handle(node, this.#root, [...this.#path, node.blueprint.definition.name]),
    );
  }

  value(): ValueOf<Definition> | undefined {
    // SAFETY: this node was constructed from a `TokenInstanceRef` of `Definition`.
    return this.#node.valueState.kind === "present"
      ? (this.#node.valueState.value as ValueOf<Definition>)
      : undefined;
  }
}

class RuleTracker {
  readonly #changedDefinitions = new Set<TokenDefinitionRef>();
  readonly #changedNodes = new Set<LiveNode>();
  readonly #program: RuleProgram;

  constructor(program: RuleProgram) {
    this.#program = program;
  }

  markDefinition(definition: TokenDefinitionRef): void {
    this.#changedDefinitions.add(definition);
  }
  markNode(node: LiveNode): void {
    this.#changedNodes.add(node);
  }

  takeEntries(): readonly RuleEntry[] {
    const candidates = [...this.#takeCandidates()];
    const affected = this.#takeAffected();
    return candidates.flatMap(plan => collectEntries(plan, affected));
  }

  #takeAffected(): ReadonlySet<LiveNode> {
    const affected = new Set<LiveNode>();
    for (const node of this.#changedNodes) collectAffectedNodes(node, affected);
    this.#changedNodes.clear();
    return affected;
  }

  #takeCandidates(): ReadonlySet<RulePlan> {
    const candidates = new Set<RulePlan>();
    for (const definition of this.#changedDefinitions)
      for (const plan of this.#program.plansFor(definition)) candidates.add(plan);
    this.#changedDefinitions.clear();
    return candidates;
  }
}

function collectEntries(plan: RulePlan, affected: ReadonlySet<LiveNode>): readonly RuleEntry[] {
  return [...affected]
    .filter(node => node.blueprint.definition === plan.condition.definition)
    .filter(node => matches(node, plan.condition))
    .map(node => ({node, rule: plan.rule}));
}

function collectAffectedNodes(node: LiveNode, into: Set<LiveNode>): void {
  if (into.has(node)) return;
  into.add(node);
  for (const owner of node.incoming) collectAffectedNodes(owner, into);
}

function initialState(program: RuleProgram): GraphState {
  return {
    changed: false,
    changedNodes: new Set<LiveNode>(),
    draining: false,
    nodes: new Map(),
    pendingRuleScan: false,
    rules: new RuleTracker(program),
  };
}

function matchesValue(node: LiveNode, pattern: TokenInstanceRef): boolean {
  const patternValue = getDetachedValue(pattern);
  if (patternValue.kind === "absent") return true;
  if (node.valueState.kind === "absent") return false;
  return Object.is(node.valueState.value, patternValue.value);
}

function hasExcludedNeighbour(node: LiveNode, definition: TokenDefinitionRef): boolean {
  return neighbours(node).some(neighbour => neighbour.blueprint.definition === definition);
}

function matchesRelations(node: LiveNode, pattern: TokenInstanceRef): boolean {
  const related = neighbours(node);
  return (
    !getDetachedNegativeDefinitions(pattern).some(negative =>
      hasExcludedNeighbour(node, negative),
    ) &&
    getDetachedRelations(pattern).every(relation =>
      related.some(neighbour => matches(neighbour, relation)),
    )
  );
}

function matches(node: LiveNode, pattern: TokenInstanceRef): boolean {
  if (node.blueprint.definition !== pattern.definition) return false;
  if (!matchesValue(node, pattern)) return false;
  return matchesRelations(node, pattern);
}

function neighbours(node: LiveNode): readonly LiveNode[] {
  return [...node.outgoing, ...node.incoming];
}

function targetDefinition(target: TokenDefinitionRef | TokenInstanceRef): TokenDefinitionRef {
  return isTokenDefinition(target) ? target : target.definition;
}

function matchesTarget(
  candidate: LiveNode,
  target: TokenDefinitionRef | TokenInstanceRef,
): boolean {
  if (isTokenDefinition(target)) return true;
  return matches(candidate, target);
}

function relatedNodeMatches(
  candidate: LiveNode,
  target: TokenDefinitionRef | TokenInstanceRef,
): boolean {
  const definition = targetDefinition(target);
  if (candidate.blueprint.definition !== definition) return false;
  return matchesTarget(candidate, target);
}

function mountNode(state: GraphState, blueprint: TokenInstanceRef): LiveNode {
  const mounted = state.nodes.get(blueprint);
  if (mounted !== undefined) return mounted;
  const node: LiveNode = {
    blueprint,
    incoming: new Set(),
    outgoing: [],
    rootReferences: 0,
    valueState: getDetachedValue(blueprint),
  };
  state.nodes.set(blueprint, node);
  state.changedNodes.add(node);
  state.rules.markDefinition(blueprint.definition);
  state.rules.markNode(node);
  for (const relation of getDetachedRelations(blueprint)) attachRelation(state, node, relation);
  return node;
}

function isReferenced(node: LiveNode): boolean {
  return node.rootReferences > 0 || node.incoming.size > 0;
}

function removeIfOrphaned(state: GraphState, node: LiveNode): void {
  if (isReferenced(node)) return;
  forgetNode(state, node);
}

function detachChild(state: GraphState, owner: LiveNode, child: LiveNode): void {
  child.incoming.delete(owner);
  removeIfOrphaned(state, child);
}

function forgetNode(state: GraphState, node: LiveNode): void {
  state.nodes.delete(node.blueprint);
  state.changedNodes.add(node);
  state.rules.markDefinition(node.blueprint.definition);
  const children = [...node.outgoing];
  node.outgoing.length = 0;
  for (const child of children) detachChild(state, node, child);
}

function removeRelation(state: GraphState, owner: LiveNode, target: LiveNode): void {
  const index = owner.outgoing.indexOf(target);
  if (index === -1) return;
  owner.outgoing.splice(index, 1);
  state.changedNodes.add(owner);
  state.changedNodes.add(target);
  state.rules.markDefinition(target.blueprint.definition);
  state.rules.markNode(owner);
  detachChild(state, owner, target);
}

function isConflictingRelation(left: TokenDefinitionRef, right: TokenDefinitionRef): boolean {
  return definitionsConflict(left, right);
}

function conflictsWith(candidate: LiveNode, blueprint: TokenInstanceRef): boolean {
  const existing = candidate.blueprint.definition;
  const incoming = blueprint.definition;
  if (existing === incoming) return isSingleDefinition(incoming);
  return isConflictingRelation(existing, incoming);
}

function conflictingRelations(owner: LiveNode, blueprint: TokenInstanceRef): readonly LiveNode[] {
  return owner.outgoing.filter(candidate => conflictsWith(candidate, blueprint));
}

function removeConflictingRelations(
  state: GraphState,
  owner: LiveNode,
  blueprint: TokenInstanceRef,
): void {
  for (const target of conflictingRelations(owner, blueprint)) removeRelation(state, owner, target);
}

function attachRelation(state: GraphState, owner: LiveNode, blueprint: TokenInstanceRef): void {
  const target = mountNode(state, blueprint);
  if (owner.outgoing.includes(target)) return;
  owner.outgoing.push(target);
  target.incoming.add(owner);
  state.rules.markNode(owner);
}

function mergeRelation(state: GraphState, owner: LiveNode, blueprint: TokenInstanceRef): void {
  if (owner.outgoing.some(candidate => candidate.blueprint === blueprint)) return;
  state.changedNodes.add(owner);
  state.rules.markDefinition(blueprint.definition);
  removeConflictingRelations(state, owner, blueprint);
  attachRelation(state, owner, blueprint);
}

function removeMatching(state: GraphState, owner: LiveNode, pattern: TokenInstanceRef): void {
  for (const target of [...owner.outgoing])
    if (matches(target, pattern)) removeRelation(state, owner, target);
}

function sameRelations(left: readonly LiveNode[], right: readonly TokenInstanceRef[]): boolean {
  return (
    left.length === right.length &&
    left.every((target, index) => sameStructure(target.blueprint, right[index]!))
  );
}

function detachAll(state: GraphState, owner: LiveNode): void {
  for (const target of [...owner.outgoing]) removeRelation(state, owner, target);
}

function attachAll(
  state: GraphState,
  owner: LiveNode,
  blueprints: readonly TokenInstanceRef[],
): void {
  for (const blueprint of blueprints) mergeRelation(state, owner, blueprint);
}

function setRelations(
  state: GraphState,
  owner: LiveNode,
  blueprints: readonly TokenInstanceRef[],
): void {
  if (sameRelations(owner.outgoing, blueprints)) return;
  detachAll(state, owner);
  attachAll(state, owner, blueprints);
}

function sameValue(left: TokenValueState, right: TokenValueState): boolean {
  if (left.kind === "absent") return right.kind === "absent";
  if (right.kind === "absent") return false;
  return Object.is(left.value, right.value);
}

function sameNestedRelations(left: TokenInstanceRef, right: TokenInstanceRef): boolean {
  const leftRelations = getDetachedRelations(left);
  const rightRelations = getDetachedRelations(right);
  return (
    leftRelations.length === rightRelations.length &&
    leftRelations.every((relation, index) => sameStructure(relation, rightRelations[index]!))
  );
}

function sameDefinition(left: TokenInstanceRef, right: TokenInstanceRef): boolean {
  return left.definition === right.definition && sameValue(left.valueState, right.valueState);
}

function sameStructure(left: TokenInstanceRef, right: TokenInstanceRef): boolean {
  if (left === right) return true;
  if (!sameDefinition(left, right)) return false;
  return sameNestedRelations(left, right);
}

interface RuntimeEngine {
  readonly add: (node: LiveNode, roots: readonly TokenRoot[]) => void;
  readonly del: (node: LiveNode, roots: readonly TokenRoot[]) => void;
  readonly mount: (roots: readonly TokenRoot[]) => readonly LiveNode[];
  readonly release: (nodes: readonly LiveNode[]) => void;
  readonly set: (node: LiveNode, roots: readonly TokenRoot[]) => void;
  readonly setValue: (node: LiveNode, value: TokenValue) => void;
}

type HandleNode = <Root extends string, Path extends readonly string[]>(
  node: LiveNode,
  root: Root,
  path: Path,
) => LiveToken<TokenDefinitionRef, Root, Path>;

function makeEngine(options: {
  readonly handle: HandleNode;
  readonly publish: (change: GraphChange) => void;
  readonly publishFailure: (failure: RuleFailure) => void;
  readonly state: GraphState;
}): RuntimeEngine {
  const {state} = options;

  const flushChanges = (): void => {
    if (!state.changed) return;
    state.changed = false;
    const tokens = [...state.changedNodes].map(node =>
      options.handle(node, node.blueprint.definition.name, [] as const),
    );
    state.changedNodes.clear();
    options.publish({kind: "update", tokens});
  };

  const entryStillMatches = (entry: RuleEntry): boolean =>
    state.nodes.has(entry.node.blueprint) && matches(entry.node, entry.rule.condition);

  const runRule = (entry: RuleEntry): void => {
    if (!entryStillMatches(entry)) return;
    const token = options.handle(entry.node, entry.node.blueprint.definition.name, [] as const);
    const exit = Effect.runSyncExit(Effect.sync(() => executeHandler(entry.rule.handler, token)));
    if (Exit.isFailure(exit))
      options.publishFailure({cause: withoutStackTrace(exit.cause), rule: entry.rule.name, token});
  };

  const drain = (): void => {
    state.draining = true;
    while (state.pendingRuleScan) {
      state.pendingRuleScan = false;
      const entries = state.rules.takeEntries();
      for (const entry of entries) runRule(entry);
    }
    state.draining = false;
    flushChanges();
  };

  const mutate = (mutation: (state: GraphState) => void): void => {
    mutation(state);
    state.changed = true;
    state.pendingRuleScan = true;
    if (state.draining) return;
    drain();
  };

  return {
    add: (node, roots) =>
      mutate(current => {
        for (const root of roots) mergeRelation(current, node, expandRoot(root));
      }),
    del: (node, roots) =>
      mutate(current => {
        for (const root of roots) removeMatching(current, node, expandRoot(root));
      }),
    mount: roots => {
      let mounted: readonly LiveNode[] = [];
      mutate(current => {
        mounted = roots.map(root => mountNode(current, expandRoot(root)));
        for (const node of mounted) node.rootReferences += 1;
      });
      return mounted;
    },
    release: nodes =>
      mutate(current => {
        for (const node of nodes) {
          node.rootReferences -= 1;
          removeIfOrphaned(current, node);
        }
      }),
    set: (node, roots) =>
      mutate(current => {
        setRelations(
          current,
          node,
          roots.map(root => expandRoot(root)),
        );
      }),
    setValue: (node, value) =>
      mutate(current => {
        const unchanged =
          node.valueState.kind === "present" && Object.is(node.valueState.value, value);
        if (unchanged) return;
        node.valueState = {kind: "present", value};
        current.changedNodes.add(node);
        current.rules.markDefinition(node.blueprint.definition);
        current.rules.markNode(node);
      }),
  };
}

function executeHandler(
  handler: RuntimeRuleHandler,
  token: LiveToken<TokenDefinitionRef, string, readonly []>,
): void {
  const iterator = handler(token);
  runSteps(iterator, iterator.next());
}

type HandlerGenerator = ReturnType<RuntimeRuleHandler>;

function runSteps(
  iterator: HandlerGenerator,
  step: IteratorResult<WhuiyEffect<void, WriteAddress>, void>,
): void {
  if (step.done) return;
  executeOperation(step.value);
  runSteps(iterator, iterator.next());
}

function executeOperation(operation: WhuiyEffect<void, WriteAddress>): void {
  const run = operationRuns.get(operation);
  if (run !== undefined) return run();
  Effect.runSync(operation);
}

/** @internal */
export const make = Effect.fn("WhuiyRuntime.make")(function* (program: RuleProgram) {
  const state = initialState(program);
  const revision = yield* SubscriptionRef.make<GraphChange>({kind: "initial"});
  const failurePubSub = yield* PubSub.unbounded<RuleFailure>();
  const listeners = new Set<(change: GraphChange) => void>();
  let operations: RuntimeOperations | undefined;

  const publish = (change: GraphChange): void => {
    revision.value = change;
    PubSub.publishUnsafe(revision.pubsub, change);
    for (const listener of listeners) listener(change);
  };

  const handle: HandleNode = (node, root, path) => {
    if (operations === undefined) throw new Error("Whuiy runtime is not initialized");
    return new LiveTokenImpl<TokenDefinitionRef, typeof root, typeof path>({
      node,
      path,
      root,
      runtime: operations,
    });
  };

  const engine = makeEngine({
    handle,
    publish,
    publishFailure: failure => {
      PubSub.publishUnsafe(failurePubSub, failure);
    },
    state,
  });

  const findRelated = (
    node: LiveNode,
    target: TokenDefinitionRef | TokenInstanceRef,
  ): readonly LiveNode[] =>
    neighbours(node).filter(candidate => relatedNodeMatches(candidate, target));

  operations = {
    add: engine.add,
    del: engine.del,
    findRelated,
    handle,
    set: engine.set,
    setValue: engine.setValue,
  };

  const release = (nodes: readonly LiveNode[]): Effect.Effect<Effect.Effect<void>> =>
    Effect.cached(Effect.sync(() => engine.release(nodes)));

  const mount = (...roots: readonly TokenRoot[]): Effect.Effect<Mount> =>
    Effect.gen(function* () {
      const mounted = engine.mount(roots);
      const cachedRelease = yield* release(mounted);
      return new MountImpl({
        changes: SubscriptionRef.changes(revision),
        release: cachedRelease,
        roots: mounted.map(node => handle(node, node.blueprint.definition.name, [] as const)),
      });
    });

  return {
    mount,
    ruleFailures: Stream.fromPubSub(failurePubSub),
    subscribe: listener => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  } satisfies WhuiyRuntime;
});
