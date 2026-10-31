// A `const` that is read exactly once is inlined at its one use site.
//
// A syntax rule cannot see evaluation order, a getter with a side effect, or a
// debugger watching a name, so it cannot decide on its own whether hoisting the
// initializer into its one read is safe. It can only ask the author to say so.
// `satisfies single` is that statement:
//
//   const handle = register() satisfies single;
//   handle.close();
//
// `single` is a project global that accepts every value, so the marker never
// changes the declared type and needs no other rule turned off:
//
//   type single = {} | null | undefined; // in a global declaration file
//
// Only the name matters, so the rule ships a few spellings and a project can
// add its own through `types`. Each entry is a regexp matched against the whole
// type name, so `side` does not also mark `sideEffect`; write `^sideEffect` to
// cover that whole family at once:
//
//   {"types": ["single", "side", "inline", "^sideEffect"]}
//
// A name is a poor marker too though, because many bindings are read once for
// real reasons: an environment constant, a schema, a table that exists to be
// read. `vars` exempts them by name, each entry a regexp matched anywhere in the
// variable name. It defaults to the SCREAMING_CASE convention, so a module-level
// constant needs no listing, and the same mechanism covers whatever else a
// project reads once on purpose:
//
//   {"vars": ["^[A-Z][A-Z0-9_]*$", "^sideEffect", "SCHEMA", "ROUTES"]}
//
// Configuring either list replaces its default rather than adding to it, so
// spell the uppercase pattern back out to keep it. An empty list exempts
// nothing, which is how `{"vars": []}` brings SCREAMING_CASE back under the rule.
//
// The label form (`side: { ... }`) is not accepted: it needs `no-labels` and
// `no-unused-labels` off repo-wide, and `satisfies` covers the same ground.

import type {
  Context,
  ESTree,
  Options as Given,
  Reference,
  SourceCode,
  Visitor,
} from "@oxlint/plugins";

import {defineRule} from "@oxlint/plugins";

/** The marker the rule is named for, and the one a report advises by default. */
const PRIMARY_TYPE = "single";

/** Marker names accepted when no `types` option is configured, primary first. */
const DEFAULT_TYPES: readonly string[] = [PRIMARY_TYPE, "side", "inline", "sideEffect"];

/** Names exempt from the rule when no `vars` option is configured. */
const DEFAULT_VARS: readonly string[] = ["^[A-Z][A-Z0-9_]*$"];

/** A pattern plain enough to read back as a type name in a report. */
const NAMED = /^[A-Za-z_$][A-Za-z0-9_$]*$/u;

type Wrapper = ESTree.TSSatisfiesExpression | ESTree.ParenthesizedExpression;

type SingleConst = ESTree.VariableDeclaration & {
  readonly declarations: readonly [ESTree.VariableDeclarator];
};

type Initialized = ESTree.VariableDeclarator & {
  readonly id: ESTree.BindingIdentifier;
  readonly init: ESTree.Expression;
};

/** The rule options, whose shape oxlint has already checked against the schema. */
type RuleOptions = {types?: string[]; vars?: string[]};

/** The patterns and exemptions one lint run works under. */
type Settings = {
  readonly types: readonly RegExp[];
  readonly vars: readonly RegExp[];
  readonly marker: string;
};

/** A pattern that has to match a type name whole. */
const exact = (pattern: string): RegExp => new RegExp("^(?:" + pattern + ")$", "u");

/** A pattern free to match anywhere in a variable name. */
const anywhere = (pattern: string): RegExp => new RegExp(pattern, "u");

/** The patterns in force for an option, or its fallback when the option is absent. */
const inForce = (listed: string[] | undefined, fallback: readonly string[]): readonly string[] =>
  listed ?? fallback;

/** The first pattern, or null when the list is empty. */
const firstOf = (patterns: readonly string[]): string | null => patterns[0] ?? null;

/** True when a pattern reads back as a type name to advise in a report. */
const readsAsType = (pattern: string | null): pattern is string =>
  pattern !== null && NAMED.test(pattern);

/** The escape hatch a report names, spelled out when the first pattern reads as a type. */
const escapeHatch = (patterns: readonly string[]): string => {
  const first = firstOf(patterns);
  return readsAsType(first) ? "`satisfies " + first + "`" : "a `satisfies` marker";
};

/** The rule options as a shape to read, empty when none are configured. */
const configured = (option: Given[number] | undefined): RuleOptions =>
  // SAFETY: oxlint checks every rule option against `meta.schema` before the rule runs.
  (option ?? {}) as RuleOptions;

/** The settings one lint run works under, from the rule options. */
function settings(option: Given[number] | undefined): Settings {
  const given = configured(option);
  const types = inForce(given.types, DEFAULT_TYPES);
  return {
    types: types.map(exact),
    vars: inForce(given.vars, DEFAULT_VARS).map(anywhere),
    marker: escapeHatch(types),
  };
}

/** A declaration of exactly one `const`. */
function isSingleConst(node: ESTree.VariableDeclaration): node is SingleConst {
  return node.kind === "const" && node.declarations.length === 1;
}

/** A declarator that binds an identifier to an initializer. */
function isInitialized(declarator: ESTree.VariableDeclarator): declarator is Initialized {
  return declarator.init !== null && declarator.id.type === "Identifier";
}

/** The nodes `satisfies` and parentheses add around an expression. */
const isWrapper = (node: ESTree.Expression): node is Wrapper =>
  node.type === "TSSatisfiesExpression" || node.type === "ParenthesizedExpression";

/** The value an expression produces, under any `satisfies` and parentheses. */
function innerValue(start: ESTree.Expression): ESTree.Expression {
  let current = start;
  while (isWrapper(current)) current = current.expression;
  return current;
}

/** The wrapper nodes around an expression, outermost first. */
function wrappers(start: ESTree.Expression): Wrapper[] {
  const found: Wrapper[] = [];
  let current = start;
  while (isWrapper(current)) {
    found.push(current);
    current = current.expression;
  }
  return found;
}

/** The value kinds whose name is a naming decision rather than an inlining one. */
const isNamedValue = (type: string): boolean =>
  type === "ArrowFunctionExpression" || type === "FunctionExpression" || type === "ClassExpression";

/** The name of a `satisfies` type reference, `side` in `x satisfies side`. */
function referencedName(type: ESTree.TSType): string | null {
  if (type.type !== "TSTypeReference") return null;
  return type.typeName.type === "Identifier" ? type.typeName.name : null;
}

/** True when a `satisfies` type names a configured marker, whole. */
function marks(named: Settings, type: ESTree.TSType): boolean {
  const name = referencedName(type);
  return name !== null && named.types.some(pattern => pattern.test(name));
}

/** True when a wrapper is a `satisfies` over one of the marker names. */
const isMarker = (named: Settings, node: Wrapper): boolean =>
  node.type === "TSSatisfiesExpression" && marks(named, node.typeAnnotation);

/** True when a `satisfies` around the initializer names a marker. */
const hasMarker = (named: Settings, start: ESTree.Expression): boolean =>
  wrappers(start).some(node => isMarker(named, node));

/** True when the initializer names a function or class rather than producing a value. */
const namesValue = (start: ESTree.Expression): boolean => isNamedValue(innerValue(start).type);

/** True when a configured pattern exempts a binding by name. */
const isExemptName = (named: Settings, name: string): boolean =>
  named.vars.some(pattern => pattern.test(name));

/** A binding is deliberate when it is named, marked, or exempt by name. */
const isDeliberate = (named: Settings, declarator: Initialized): boolean =>
  namesValue(declarator.init) ||
  isExemptName(named, declarator.id.name) ||
  hasMarker(named, declarator.init);

/** A declarator the rule goes on to count reads for. */
const isCandidate = (
  named: Settings,
  declarator: ESTree.VariableDeclarator,
): declarator is Initialized => isInitialized(declarator) && !isDeliberate(named, declarator);

/** A read of the binding, other than the declaration's own initializer. */
const isRuntimeRead = (reference: Reference): boolean => reference.isRead() && !reference.init;

/** The runtime reads of `name` declared by `declaration`. */
function readsOf(
  sourceCode: SourceCode,
  declaration: ESTree.VariableDeclaration,
  name: string,
): Reference[] {
  const declared = sourceCode.getDeclaredVariables(declaration).find(item => item.name === name);
  return declared === undefined ? [] : declared.references.filter(isRuntimeRead);
}

/** True when the binding declared by `node` is read exactly once. */
const singleRead = (context: Context, node: ESTree.VariableDeclaration, name: string): boolean =>
  readsOf(context.sourceCode, node, name).length === 1;

/** The offending identifier of one declarator, or null when the binding stands. */
function offenceFor(
  context: Context,
  named: Settings,
  node: ESTree.VariableDeclaration,
  declarator: ESTree.VariableDeclarator,
): ESTree.BindingIdentifier | null {
  if (!isCandidate(named, declarator)) return null;
  return singleRead(context, node, declarator.id.name) ? declarator.id : null;
}

/** The single-use constant declared by `node`, or null when nothing is wrong. */
function offence(
  context: Context,
  named: Settings,
  node: ESTree.VariableDeclaration,
): ESTree.BindingIdentifier | null {
  if (!isSingleConst(node)) return null;
  return offenceFor(context, named, node, node.declarations[0]);
}

/** The visitor the rule runs with, which reads its options once per declaration. */
function variableChecks(context: Context): Visitor {
  return {
    VariableDeclaration: node => {
      const named = settings(context.options?.[0]);
      const found = offence(context, named, node);
      if (found === null) return;
      context.report({
        node: found,
        messageId: "singleUse",
        data: {name: found.name, marker: named.marker},
      });
    },
  };
}

/** Require a constant read once to be inlined, or marked `satisfies single`. */
export const noSingleUseConstRule = defineRule({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Require a constant that is read once to be inlined at its use site, or marked `satisfies single`.",
    },
    messages: {
      singleUse:
        "'{{name}}' is read once. Inline it at the use site, or add {{marker}} to the initializer.",
    },
    schema: [
      {
        type: "object",
        properties: {
          types: {type: "array", items: {type: "string", minLength: 1}, uniqueItems: true},
          vars: {type: "array", items: {type: "string", minLength: 1}, uniqueItems: true},
        },
        additionalProperties: false,
      },
    ],
  },
  createOnce(context) {
    return variableChecks(context);
  },
});
