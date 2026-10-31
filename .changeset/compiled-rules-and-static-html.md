---
"whuiy": minor
"@whuiy/dom": minor
"@whuiy/react": minor
---

Compile rules into per-element dispatch tables and render described trees to
static HTML.

- `Whuiy.compile()` lowers rules to a `RuleProgram`. Runtime matching only
  tests elements against rules that can reach their definition.
- Rules re-run when a dependency's token value changes, so derived values stay
  current without a virtual DOM.
- `Mount.changes` reports the tokens touched by each completed mutation instead
  of void, which lets adapters patch only what changed.
- `@whuiy/dom` adds `renderToString(whuiy, ...roots)` for build-time output.
- `Style`, `Event`, and `Element` generate from `lib.dom.d.ts` through
  `bun run generate`; TypeScript and Effect are now at 7.x and 4.1.
