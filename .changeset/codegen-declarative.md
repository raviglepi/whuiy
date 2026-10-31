---
"@whuiy/codegen": minor
---

Add `@whuiy/codegen`: declarative rules compiled to plain DOM and Effect code.

- `define({description, runtime, state}, rules => [...])` declares state cells,
  event rules, derived text, visibility, dynamic style properties, and list
  regions.
- `compile(program)` lowers a program to a self-contained module. The generated
  `mount(parent)` creates elements with `document.createElement`, assigns styles
  directly, attaches listeners that run `Effect.runFork(handler(setters, event))`,
  and calls exactly the derived updates that a written cell depends on.
- The generated module imports `effect` and the named handlers from the
  program's `runtime` module; it never imports `whuiy`, so the built app ships
  no rules engine.
- `examples/manual` is a compiled counter plus filtered list; its
  `generate.ts --check` keeps the committed output in sync, and `vite build`
  produces a bundle with no framework code.
