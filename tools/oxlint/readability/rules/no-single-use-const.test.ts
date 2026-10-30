// Run with `node`: Node strips the types, and oxlint's RuleTester needs Node
// rather than Bun, whose raw-transfer path declines to run under it.
//
//   node tools/oxlint/readability/rules/no-single-use-const.test.ts

import {RuleTester} from "oxlint/plugins-dev";
import {noSingleUseConstRule} from "./no-single-use-const.ts";

const error = {messageId: "singleUse"};

// The marker is a project global, so every marked case declares its own.
const SINGLE = "type single = {} | null | undefined;";
const SIDE = "type side = {} | null | undefined;";
const SIDE_EFFECT = "type sideEffect = {} | null | undefined;";

new RuleTester({languageOptions: {parserOptions: {lang: "ts"}}}).run(
  "readability/no-single-use-const",
  noSingleUseConstRule,
  {
    valid: [
      // Read twice, so inlining would repeat the initializer.
      "const name = 'Ada'; log(name, name);",
      // Exported, so there is no one use site to inline into.
      "export const api = makeApi();",
      // Naming a function is a naming decision, not an inlining one.
      "const format = (n: number): string => String(n); log(format(1));",
      // Two declarators are handled as a group.
      "const left = 1, right = 2; log(left + right);",
      // The marker is the escape hatch, in each default spelling.
      `${SINGLE} const handle = register() satisfies single; handle.close();`,
      `${SIDE} const stream = open() satisfies side; stream.close();`,
      `${SIDE} const settled = open() satisfies inline; settled.close();`,
      `${SIDE_EFFECT} const effect = open() satisfies sideEffect; effect.close();`,
      // The marker survives parentheses around the initializer.
      `${SINGLE} const wrapped = (settle()) satisfies single; wrapped.wait();`,
      // SCREAMING_CASE is exempt by default, without listing every constant.
      "const MAX_RETRIES = 10; log(MAX_RETRIES);",
      // A listed pattern is exempt anywhere in the binding's name.
      {
        code: "const sideEffectCleanup = register(); sideEffectCleanup();",
        options: [{vars: ["^sideEffect"]}],
      },
      // Listing a pattern replaces the default, so this one has to spell the
      // uppercase convention back out to keep it.
      {
        code: "const MAX_RETRIES = 10; log(MAX_RETRIES);",
        options: [{vars: ["^[A-Z][A-Z0-9_]*$", "^sideEffect"]}],
      },
      // A configured marker is a regexp matched against the whole type name.
      {
        code: `${SIDE_EFFECT} const h = register() satisfies sideEffect; h.close();`,
        options: [{types: ["^sideEffect"]}],
      },
    ],
    invalid: [
      {code: "const greeting = 'hello'; log(greeting);", errors: [error]},
      {
        // A call result read once is still a single-use binding; the rule does
        // not try to prove the call is pure.
        code: "const id = buildId(user); save(id);",
        errors: [error],
      },
      {
        // A `satisfies` for something else does not mark the binding.
        code: "const label = compute() satisfies string; log(label);",
        errors: [error],
      },
      {
        // Every marker is matched whole, so `sideEffect` does not also mark
        // `sideEffectHandle`.
        code: `type sideEffectHandle = {} | null | undefined; const h = register() satisfies sideEffectHandle; h.close();`,
        errors: [error],
      },
      {
        // An empty `vars` exempts nothing, which brings SCREAMING_CASE back.
        code: "const MAX_RETRIES = 10; log(MAX_RETRIES);",
        options: [{vars: []}],
        errors: [error],
      },
      {
        // Configuring `types` replaces the defaults rather than adding to them.
        code: `${SIDE} const handle = register() satisfies side; handle.close();`,
        options: [{types: ["inline"]}],
        errors: [error],
      },
    ],
  },
);
