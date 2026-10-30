import {defineConfig} from "oxlint";
import {createOxlintConfig} from "./tools/oxlint/config.ts";

const base = createOxlintConfig();

// Effect rules that tsconfig.json enables but the shared preset omits, so that
// `bun run lint` is the single check for Effect code.
export default defineConfig({
  ...base,
  rules: {
    ...base.rules,
    ...({
      "effecttsgo/prefer-barrel-import": "error",
      "effecttsgo/any-unknown-in-error-context": "error",
      "effecttsgo/unsafe-effect-type-assertion": "error",
      "effecttsgo/instance-of-schema": "error",
      "effecttsgo/deterministic-keys": "error",
      "effecttsgo/missing-effect-service-dependency": "error",
      "effecttsgo/leaking-requirements": "error",
      "effecttsgo/global-error-in-effect-catch": "error",
      "effecttsgo/global-error-in-effect-failure": "error",
      "effecttsgo/unknown-in-effect-catch": "error",
      "effecttsgo/prefer-schema-over-json": "error",
      "effecttsgo/schema-sync-in-effect": "error",
      "effecttsgo/crypto-random-uuid": "error",
      "effecttsgo/crypto-random-uuid-in-effect": "error",
      "effecttsgo/node-builtin-import": "error",
      "effecttsgo/global-date": "error",
      "effecttsgo/global-date-in-effect": "error",
      "effecttsgo/global-console": "error",
      "effecttsgo/global-console-in-effect": "error",
      "effecttsgo/global-random": "error",
      "effecttsgo/global-random-in-effect": "error",
      "effecttsgo/global-timers": "error",
      "effecttsgo/global-timers-in-effect": "error",
      "effecttsgo/global-fetch": "error",
      "effecttsgo/global-fetch-in-effect": "error",
    } as const satisfies NonNullable<import("oxlint").OxlintConfig["rules"]>),
  },
});
