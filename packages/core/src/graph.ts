/** @since 0.1.0 */

import type {RuleProgram} from "./compile.ts";
import type {WhuiyEffect, WriteAddress} from "./operation.ts";
import type {RuntimeRule, RuleFailure} from "./rules.ts";
import type {
  DefinitionName,
  DefinitionOf,
  ExpandAlias,
  LiveToken,
  TokenDefinitionRef,
  TokenInstanceRef,
  TokenRoot,
  TokenValue,
  ValueOf,
} from "./token.ts";

import {Cause, Effect, Exit, Match, PubSub, Ref, Stream, SubscriptionRef} from "effect";

import {OperationWritesId} from "./operation.ts";
import {
  expandRoot,
  getDetachedNegativeDefinitions,
  getDetachedRelations,
  getDetachedValue,
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
  readonly outgoing: Map<TokenDefinitionRef, LiveNode>;
  rootReferences: number;
  valueState: {readonly kind: "absent"} | {readonly kind: "present"; readonly value: unknown};
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
  readonly nodesByDefinition: Map<TokenDefinitionRef, Set<LiveNode>>;
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

type DrainCompletion =
  | {readonly kind: "continue"}
  | {
      readonly changed: boolean;
      readonly kind: "complete";
      readonly tokens: readonly LiveToken[];
    };

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
}

interface RuntimeOperations extends WhuiyRuntime {
  readonly add: (node: LiveNode, roots: readonly TokenRoot[]) => Effect.Effect<void>;
  readonly del: (node: LiveNode, roots: readonly TokenRoot[]) => Effect.Effect<void>;
  readonly findRelated: (
    node: LiveNode,
    target: TokenDefinitionRef | TokenInstanceRef,
  ) => LiveNode | undefined;
  readonly handle: <Root extends string, Path extends readonly string[]>(
    node: LiveNode,
    root: Root,
    path: Path,
  ) => LiveToken<TokenDefinitionRef, Root, Path>;
  readonly releaseRoots: (nodes: readonly LiveNode[]) => Effect.Effect<void>;
  readonly set: (node: LiveNode, roots: readonly TokenRoot[]) => Effect.Effect<void>;
  readonly setValue: (node: LiveNode, value: TokenValue) => Effect.Effect<void>;
}

function makeOperation<Writes extends WriteAddress>(options: {
  readonly effect: Effect.Effect<void>;
  readonly writes: Writes;
}): WhuiyEffect<void, Writes> {
  // SAFETY: `WhuiyEffect` only augments Effect with this exact write marker.
  return Object.assign(options.effect, {[OperationWritesId]: options.writes}) as WhuiyEffect<
    void,
    Writes
  >;
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

  add<const Terms extends readonly TokenRoot[]>(
    ...terms: Terms
  ): WhuiyEffect<void, WriteAddress<Root, Path, {readonly kind: "relations"}>> {
    return makeOperation({
      effect: this.#runtime.add(this.#node, terms),
      writes: {path: this.#path, root: this.#root, slot: {kind: "relations"}},
    });
  }

  del<const Terms extends readonly TokenRoot[]>(
    ...terms: Terms
  ): WhuiyEffect<void, RelationWrite<Terms, Root, Path>> {
    // SAFETY: every joined name is derived from one of `Terms`.
    const definition = terms
      .map(term => expandRoot(term).definition.name)
      .join("|") as DefinitionName<DefinitionOf<ExpandAlias<Terms[number]>>>;
    return makeOperation({
      effect: this.#runtime.del(this.#node, terms),
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
    const definition = isTokenDefinition(target) ? target : target.definition;
    const node = this.#runtime.findRelated(this.#node, target);
    if (node === undefined)
      throw new Error(
        `Token ${this.definition.name}#${this.id} has no ${definition.name} relation`,
      );
    return new LiveTokenImpl({
      node,
      path: [...this.#path, definition.name],
      root: this.#root,
      runtime: this.#runtime,
    });
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
      effect: this.#runtime.set(this.#node, terms),
      writes: {path: this.#path, root: this.#root, slot: {kind: "relations"}},
    });
  }

  setValue(
    value: ValueOf<Definition>,
  ): WhuiyEffect<void, WriteAddress<Root, Path, {readonly kind: "value"}>> {
    return makeOperation({
      effect: this.#runtime.setValue(this.#node, value),
      writes: {path: this.#path, root: this.#root, slot: {kind: "value"}},
    });
  }

  tokens(): readonly LiveToken[] {
    return [...this.#node.outgoing.values()].map(node =>
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
  readonly #activeMatches = new Map<RuntimeRule, Set<number>>();
  readonly #changedDefinitions = new Set<TokenDefinitionRef>();
  readonly #program: RuleProgram;

  constructor(program: RuleProgram) {
    this.#program = program;
    for (const entry of program.plans) this.#activeMatches.set(entry.rule, new Set());
  }

  markChanged(definition: TokenDefinitionRef): void {
    this.#changedDefinitions.add(definition);
  }

  takeEntries(index: ReadonlyMap<TokenDefinitionRef, ReadonlySet<LiveNode>>): readonly RuleEntry[] {
    const candidates = this.#takeCandidates();
    const entries: RuleEntry[] = [];
    for (const [rule, previous] of this.#activeMatches)
      if (!candidates.has(rule)) continue;
      else entries.push(...this.#newEntries(index, rule, previous));
    return entries;
  }

  #takeCandidates(): ReadonlySet<RuntimeRule> {
    const candidates = new Set<RuntimeRule>();
    for (const definition of this.#changedDefinitions)
      for (const entry of this.#program.plansFor(definition)) candidates.add(entry.rule);
    this.#changedDefinitions.clear();
    return candidates;
  }

  #newEntries(
    index: ReadonlyMap<TokenDefinitionRef, ReadonlySet<LiveNode>>,
    rule: RuntimeRule,
    previous: ReadonlySet<number>,
  ): readonly RuleEntry[] {
    const nodes = [...(index.get(rule.condition.definition) ?? EMPTY_NODES)].filter(node =>
      matches(node, rule.condition),
    );
    const current = new Set(nodes.map(node => node.blueprint.id));
    const entries = nodes
      .filter(node => current.has(node.blueprint.id) && !previous.has(node.blueprint.id))
      .map(node => ({node, rule}));
    this.#activeMatches.set(rule, current);
    return entries;
  }
}

const EMPTY_NODES: ReadonlySet<LiveNode> = new Set<LiveNode>();

function initialState(program: RuleProgram): GraphState {
  return {
    changed: false,
    changedNodes: new Set<LiveNode>(),
    draining: false,
    nodes: new Map(),
    nodesByDefinition: new Map(),
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
  return [...node.outgoing.values(), ...node.incoming].some(
    neighbour => neighbour.blueprint.definition === definition,
  );
}

function matchesRelations(node: LiveNode, pattern: TokenInstanceRef): boolean {
  const neighbours = [...node.outgoing.values(), ...node.incoming];
  return (
    !getDetachedNegativeDefinitions(pattern).some(negative =>
      hasExcludedNeighbour(node, negative),
    ) &&
    getDetachedRelations(pattern).every(relation =>
      neighbours.some(neighbour => matches(neighbour, relation)),
    )
  );
}

function matches(node: LiveNode, pattern: TokenInstanceRef): boolean {
  if (node.blueprint.definition !== pattern.definition) return false;
  if (!matchesValue(node, pattern)) return false;
  return matchesRelations(node, pattern);
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
    outgoing: new Map(),
    rootReferences: 0,
    valueState: getDetachedValue(blueprint),
  };
  state.nodes.set(blueprint, node);
  indexNode(state, node);
  state.changedNodes.add(node);
  state.rules.markChanged(blueprint.definition);
  for (const relation of getDetachedRelations(blueprint)) {
    const target = mountNode(state, relation);
    node.outgoing.set(relation.definition, target);
    target.incoming.add(node);
  }
  return node;
}

function indexNode(state: GraphState, node: LiveNode): void {
  const definition = node.blueprint.definition;
  const indexed = state.nodesByDefinition.get(definition)?.add(node);
  if (indexed === undefined) state.nodesByDefinition.set(definition, new Set([node]));
}

function isReferenced(node: LiveNode): boolean {
  return node.rootReferences > 0 || node.incoming.size > 0;
}

function removeIfOrphaned(state: GraphState, node: LiveNode): void {
  if (isReferenced(node)) return;
  forgetNode(state, node);
}

function forgetNode(state: GraphState, node: LiveNode): void {
  state.nodes.delete(node.blueprint);
  state.nodesByDefinition.get(node.blueprint.definition)?.delete(node);
  state.changedNodes.add(node);
  state.rules.markChanged(node.blueprint.definition);
  for (const target of node.outgoing.values()) {
    target.incoming.delete(node);
    removeIfOrphaned(state, target);
  }
  node.outgoing.clear();
}

function detach(state: GraphState, owner: LiveNode, target: LiveNode): void {
  target.incoming.delete(owner);
  removeIfOrphaned(state, target);
}

function removeRelation(state: GraphState, owner: LiveNode, definition: TokenDefinitionRef): void {
  const target = owner.outgoing.get(definition);
  if (target === undefined) return;
  owner.outgoing.delete(definition);
  state.changedNodes.add(owner);
  state.changedNodes.add(target);
  state.rules.markChanged(owner.blueprint.definition);
  state.rules.markChanged(target.blueprint.definition);
  detach(state, owner, target);
}

function removeConflictingRelations(
  state: GraphState,
  owner: LiveNode,
  blueprint: TokenInstanceRef,
): void {
  for (const [definition] of owner.outgoing)
    if (isConflictingRelation(definition, blueprint.definition))
      removeRelation(state, owner, definition);
}

function isConflictingRelation(left: TokenDefinitionRef, right: TokenDefinitionRef): boolean {
  return left !== right && definitionsConflict(left, right);
}

function hasBlueprint(existing: LiveNode | undefined, blueprint: TokenInstanceRef): boolean {
  return existing !== undefined && existing.blueprint === blueprint;
}

function detachExisting(state: GraphState, owner: LiveNode, existing: LiveNode | undefined): void {
  if (existing !== undefined) detach(state, owner, existing);
}

function attachRelation(state: GraphState, owner: LiveNode, blueprint: TokenInstanceRef): void {
  const existing = owner.outgoing.get(blueprint.definition);
  if (hasBlueprint(existing, blueprint)) return;
  detachExisting(state, owner, existing);
  const target = mountNode(state, blueprint);
  owner.outgoing.set(blueprint.definition, target);
  target.incoming.add(owner);
}

function mergeRelation(state: GraphState, owner: LiveNode, blueprint: TokenInstanceRef): void {
  state.changedNodes.add(owner);
  state.rules.markChanged(owner.blueprint.definition);
  state.rules.markChanged(blueprint.definition);
  removeConflictingRelations(state, owner, blueprint);
  attachRelation(state, owner, blueprint);
}

/** @internal */
export const make = Effect.fn("WhuiyRuntime.make")(function* (program: RuleProgram) {
  const initial = initialState(program);
  const state = yield* Ref.make(initial);
  const revision = yield* SubscriptionRef.make<GraphChange>({kind: "initial"});
  const failurePubSub = yield* PubSub.unbounded<RuleFailure>();
  let runtime: RuntimeOperations;

  const handle = <Root extends string, Path extends readonly string[]>(
    node: LiveNode,
    root: Root,
    path: Path,
  ): LiveToken<TokenDefinitionRef, Root, Path> => new LiveTokenImpl({node, path, root, runtime});

  // Capture a rule's exit without adding engine stack frames to the domain failure.
  const captureRuleExit = Effect.fnUntraced(function* (entry: RuleEntry) {
    const token = runtime.handle(entry.node, entry.node.blueprint.definition.name, [] as const);
    const exit = yield* Effect.exit(Effect.gen(() => entry.rule.handler(token)));
    return {exit, token};
  });
  const entryStillMatches = (entry: RuleEntry): Effect.Effect<boolean> =>
    Ref.get(state).pipe(
      Effect.map(
        current =>
          current.nodes.has(entry.node.blueprint) && matches(entry.node, entry.rule.condition),
      ),
    );
  const runRule = Effect.fn("WhuiyRuntime.runRule")(function* (entry: RuleEntry) {
    if (!(yield* entryStillMatches(entry))) return;
    const {exit, token} = yield* captureRuleExit(entry);
    if (Exit.isFailure(exit))
      yield* PubSub.publish(failurePubSub, {
        cause: withoutStackTrace(exit.cause),
        rule: entry.rule.name,
        token,
      });
  });

  const takePendingEntries = Ref.modify(state, current => {
    if (!current.pendingRuleScan) return [undefined, current] as const;
    current.pendingRuleScan = false;
    return [current.rules.takeEntries(current.nodesByDefinition), current] as const;
  });
  const completeDrain = Ref.modify(state, (current): readonly [DrainCompletion, GraphState] => {
    if (current.pendingRuleScan) return [{kind: "continue"}, current];
    const changed = current.changed;
    current.changed = false;
    current.draining = false;
    const tokens = [...current.changedNodes].map(node =>
      handle(node, node.blueprint.definition.name, [] as const),
    );
    current.changedNodes.clear();
    return [{changed, kind: "complete", tokens}, current];
  });
  let drainRules: () => Effect.Effect<void>;
  const finishDrain = Effect.fn("WhuiyRuntime.finishDrain")(function* () {
    const completion = yield* completeDrain;
    if (completion.kind === "continue") return yield* drainRules();
    if (completion.changed)
      yield* SubscriptionRef.set(revision, {kind: "update", tokens: completion.tokens});
  });
  drainRules = Effect.fn("WhuiyRuntime.drainRules")(function* () {
    const entries = yield* takePendingEntries;
    if (entries === undefined) return yield* finishDrain();
    yield* Effect.forEach(entries, runRule, {concurrency: 1, discard: true});
    return yield* drainRules();
  });

  const change = Effect.fn("WhuiyRuntime.change")(function* (
    mutation: (state: GraphState) => void,
  ) {
    const shouldDrain = yield* Ref.modify(state, current => {
      mutation(current);
      current.changed = true;
      current.pendingRuleScan = true;
      if (current.draining) return [false, current] as const;
      current.draining = true;
      return [true, current] as const;
    });
    if (shouldDrain) yield* drainRules();
  });

  const add = Effect.fn("WhuiyRuntime.add")(function* (
    node: LiveNode,
    roots: readonly TokenRoot[],
  ) {
    yield* change(current => {
      for (const root of roots) mergeRelation(current, node, expandRoot(root));
    });
  });
  const del = Effect.fn("WhuiyRuntime.del")(function* (
    node: LiveNode,
    roots: readonly TokenRoot[],
  ) {
    yield* change(current => {
      for (const root of roots) removeRelation(current, node, expandRoot(root).definition);
    });
  });
  const findRelated = (
    node: LiveNode,
    target: TokenDefinitionRef | TokenInstanceRef,
  ): LiveNode | undefined =>
    [...node.outgoing.values(), ...node.incoming].find(candidate =>
      relatedNodeMatches(candidate, target),
    );
  const releaseRoots = Effect.fn("WhuiyRuntime.releaseRoots")(function* (
    nodes: readonly LiveNode[],
  ) {
    yield* change(current => {
      for (const node of nodes) {
        node.rootReferences -= 1;
        removeIfOrphaned(current, node);
      }
    });
  });
  const set = Effect.fn("WhuiyRuntime.set")(function* (
    node: LiveNode,
    roots: readonly TokenRoot[],
  ) {
    yield* change(current => {
      for (const definition of node.outgoing.keys()) removeRelation(current, node, definition);
      for (const root of roots) mergeRelation(current, node, expandRoot(root));
    });
  });
  const setValue = Effect.fn("WhuiyRuntime.setValue")(function* (
    node: LiveNode,
    value: TokenValue,
  ) {
    yield* change(current => {
      node.valueState = {kind: "present", value};
      current.changedNodes.add(node);
      current.rules.markChanged(node.blueprint.definition);
    });
  });
  const mount = Effect.fn("WhuiyRuntime.mount")(function* (...roots: readonly TokenRoot[]) {
    const [mounted, shouldDrain] = yield* Ref.modify(state, current => {
      const nodes = roots.map(root => mountNode(current, expandRoot(root)));
      for (const node of nodes) node.rootReferences += 1;
      current.changed = true;
      current.pendingRuleScan = true;
      const claim = !current.draining;
      current.draining = true;
      return [[nodes, claim] as const, current] as const;
    });
    if (shouldDrain) yield* drainRules();
    const release = yield* Effect.cached(releaseRoots(mounted));
    return new MountImpl({
      changes: SubscriptionRef.changes(revision),
      release,
      roots: mounted.map(node => handle(node, node.blueprint.definition.name, [] as const)),
    });
  });

  runtime = {
    add,
    del,
    findRelated,
    handle,
    mount,
    releaseRoots,
    ruleFailures: Stream.fromPubSub(failurePubSub),
    set,
    setValue,
  };
  return runtime;
});
