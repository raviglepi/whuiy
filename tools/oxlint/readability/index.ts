import {eslintCompatPlugin} from "@oxlint/plugins";
import {noSingleUseConstRule} from "./rules/no-single-use-const.ts";

/** Oxlint rules for bindings whose shape, rather than behavior, makes them hard to follow. */
export default eslintCompatPlugin({
  meta: {name: "readability"},
  rules: {"no-single-use-const": noSingleUseConstRule},
});
