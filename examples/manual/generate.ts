import {Effect} from "effect";

import {compile} from "@whuiy/codegen";
import {program} from "./src/page.ts";

const source = compile(program, {source: "examples/manual/src/page.ts"});
const target = new URL("./src/generated.ts", import.meta.url);
const current = await Bun.file(target)
  .text()
  .catch(() => "");

if (Bun.argv.includes("--check")) {
  if (current !== source) throw new Error("src/generated.ts is stale; run bun run generate");
  Effect.runSync(Effect.log("src/generated.ts is up to date"));
} else {
  await Bun.write(target, source);
  Effect.runSync(Effect.log(`wrote src/generated.ts (${source.length} bytes)`));
}
