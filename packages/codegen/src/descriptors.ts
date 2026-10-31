/** @since 0.4.0 */

import type {Effect} from "effect";
import type {
  DefinitionName,
  DefinitionOf,
  TokenDefinitionRef,
  TokenInstanceRef,
  ValueOf,
} from "whuiy";

/**
 * The setters a compiled event handler receives for one state cell.
 *
 * **When to use**
 *
 * Handlers declare the cells they write through this service so the compiler
 * can leave a direct assignment plus the dependent updates in the generated
 * code.
 *
 * @since 0.4.0
 * @category Models
 */
export interface CellSetter<Value> {
  readonly set: (next: Value) => void;
  readonly update: (updater: (current: Value) => Value) => void;
}

/**
 * Every state cell a compiled handler receives, keyed by the uncapitalized
 * definition name.
 *
 * @since 0.4.0
 * @category Models
 */
export type Setters<State> = {readonly [Key in keyof State]: CellSetter<State[Key]>};

type StateKey<Instance extends TokenInstanceRef> = Uncapitalize<
  DefinitionName<DefinitionOf<Instance>>
>;

/**
 * The mutable state shape a program declares with its state instances.
 *
 * @since 0.4.0
 * @category Models
 */
export type StateOf<Instances extends readonly TokenInstanceRef[]> = {
  readonly [Instance in Instances[number] as StateKey<Instance>]: ValueOf<DefinitionOf<Instance>>;
};

/**
 * The subset of the state shape that a rule reads.
 *
 * @since 0.4.0
 * @category Models
 */
export type StatePick<Definitions extends readonly TokenDefinitionRef[]> = {
  readonly [
    Definition in Definitions[number] as Uncapitalize<DefinitionName<Definition>>
  ]: ValueOf<Definition>;
};

/**
 * The DOM event a compiled event token dispatches.
 *
 * @since 0.4.0
 * @category Models
 */
export type EventOf<Token extends TokenDefinitionRef> =
  ValueOf<Token> extends (...args: infer Args) => Effect.Effect<void> ? Args[0] : never;

/**
 * A handler an event rule binds.
 *
 * @since 0.4.0
 * @category Models
 */
export type EventRuleHandler<State, Token extends TokenDefinitionRef> = (
  setters: Setters<State>,
  event: EventOf<Token>,
) => Effect.Effect<void>;

/**
 * A pure function a derive or list rule runs from compiled state.
 *
 * @since 0.4.0
 * @category Models
 */
export type Mapper<State, Value extends string | number | boolean | readonly string[]> = (
  state: State,
) => Value;

/**
 * Binds a DOM event on the target's element to a named Effect handler.
 *
 * @since 0.4.0
 * @category Models
 */
export interface EventRule {
  readonly arity: number;
  readonly event: TokenDefinitionRef;
  readonly handlerName: string;
  readonly kind: "event";
  readonly target: TokenDefinitionRef | TokenInstanceRef;
}

/**
 * Recomputes one content token from named state cells.
 *
 * @since 0.4.0
 * @category Models
 */
export interface DeriveRule {
  readonly deps: readonly TokenDefinitionRef[];
  readonly kind: "derive";
  readonly mapperName: string;
  readonly target: TokenDefinitionRef | TokenInstanceRef;
}

/**
 * Renders a content box's children from named state cells.
 *
 * @since 0.4.0
 * @category Models
 */
export interface ListRule {
  readonly deps: readonly TokenDefinitionRef[];
  readonly kind: "list";
  readonly mapperName: string;
  readonly target: TokenDefinitionRef | TokenInstanceRef;
}

/**
 * Toggles an element's `hidden` property from named state cells.
 *
 * @since 0.4.0
 * @category Models
 */
export interface ShowRule {
  readonly deps: readonly TokenDefinitionRef[];
  readonly kind: "show";
  readonly mapperName: string;
  readonly target: TokenDefinitionRef | TokenInstanceRef;
}

/**
 * Writes one style property from named state cells.
 *
 * @since 0.4.0
 * @category Models
 */
export interface StyleRule {
  readonly deps: readonly TokenDefinitionRef[];
  readonly kind: "style";
  readonly mapperName: string;
  readonly property: TokenDefinitionRef;
  readonly target: TokenDefinitionRef | TokenInstanceRef;
}

/**
 * One declarative rule the compiler lowers into plain DOM code.
 *
 * @since 0.4.0
 * @category Models
 */
export type Rule = DeriveRule | EventRule | ListRule | ShowRule | StyleRule;

/**
 * What a program declares: the description, the runtime module handlers live
 * in, the mutable state cells, and the rules to compile.
 *
 * @since 0.4.0
 * @category Models
 */
export interface ProgramInput<Instances extends readonly TokenInstanceRef[] = readonly []> {
  readonly description: TokenInstanceRef;
  readonly runtime: string;
  readonly state: Instances;
}

/**
 * A compiled program's declarative source.
 *
 * @since 0.4.0
 * @category Models
 */
export interface Program {
  readonly description: TokenInstanceRef;
  readonly rules: readonly Rule[];
  readonly runtime: string;
  readonly state: readonly TokenInstanceRef[];
}

/**
 * Builds the rule list for one program, typed against its state.
 *
 * @since 0.4.0
 * @category Models
 */
export interface RuleBuilder<Instances extends readonly TokenInstanceRef[]> {
  derive: <
    const Deps extends readonly DefinitionOf<Instances[number]>[],
    Value extends string | number,
  >(
    target: TokenDefinitionRef | TokenInstanceRef,
    deps: Deps,
    mapper: Mapper<StatePick<Deps>, Value>,
  ) => DeriveRule;
  list: <const Deps extends readonly DefinitionOf<Instances[number]>[]>(
    target: TokenDefinitionRef | TokenInstanceRef,
    deps: Deps,
    mapper: Mapper<StatePick<Deps>, readonly string[]>,
  ) => ListRule;
  on: <Token extends TokenDefinitionRef>(
    target: TokenDefinitionRef | TokenInstanceRef,
    event: Token,
    handler: EventRuleHandler<StateOf<Instances>, Token>,
  ) => EventRule;
  show: <const Deps extends readonly DefinitionOf<Instances[number]>[]>(
    target: TokenDefinitionRef | TokenInstanceRef,
    deps: Deps,
    visible: Mapper<StatePick<Deps>, boolean>,
  ) => ShowRule;
  style: <const Deps extends readonly DefinitionOf<Instances[number]>[]>(
    target: TokenDefinitionRef | TokenInstanceRef,
    property: TokenDefinitionRef,
    deps: Deps,
    mapper: Mapper<StatePick<Deps>, string | number>,
  ) => StyleRule;
}

function functionName(fn: {readonly name: string}, label: string): string {
  const name = fn.name;
  if (isUsableName(name)) return name;
  throw new Error(
    `Pass a named ${label} so the generated module can import it; received ${describeName(name)}`,
  );
}

function isUsableName(name: string): boolean {
  return name.length > 0 && /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name);
}

function describeName(name: string): string {
  return name.length === 0 ? "an anonymous function" : `"${name}"`;
}

function handlerArity(handler: {readonly length: number}): number {
  return Math.min(handler.length, 2);
}

function makeBuilder<Instances extends readonly TokenInstanceRef[]>(): RuleBuilder<Instances> {
  return {
    derive: (target, deps, mapper) => ({
      deps,
      kind: "derive",
      mapperName: functionName(mapper, "mapper"),
      target,
    }),
    list: (target, deps, mapper) => ({
      deps,
      kind: "list",
      mapperName: functionName(mapper, "mapper"),
      target,
    }),
    on: (target, event, handler) => ({
      arity: handlerArity(handler),
      event,
      handlerName: functionName(handler, "handler"),
      kind: "event",
      target,
    }),
    show: (target, deps, visible) => ({
      deps,
      kind: "show",
      mapperName: functionName(visible, "mapper"),
      target,
    }),
    style: (target, property, deps, mapper) => ({
      deps,
      kind: "style",
      mapperName: functionName(mapper, "mapper"),
      property,
      target,
    }),
  };
}

/**
 * Declares a program: the description to compile, the module its handlers live
 * in, the state cells, and the rules.
 *
 * **When to use**
 *
 * Call this in a build-time module that `@whuiy/codegen`'s `compile` reads. The
 * generated module imports the named handlers from `runtime`; keep that module
 * free of `whuiy` imports so the built app ships only `effect`.
 *
 * @since 0.4.0
 * @category Constructors
 */
export function define<const Instances extends readonly TokenInstanceRef[]>(
  input: ProgramInput<Instances>,
  build: (rules: RuleBuilder<Instances>) => readonly Rule[],
): Program {
  return {
    description: input.description,
    rules: build(makeBuilder<Instances>()),
    runtime: input.runtime,
    state: input.state,
  };
}
