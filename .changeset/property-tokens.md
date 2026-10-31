---
"whuiy": minor
"@whuiy/dom": minor
"@whuiy/react": minor
---

Add a generated `Property` token family and a todo example that uses it.

- `Property` covers writable primitive platform properties of the common
  element interfaces, generated from `lib.dom.d.ts` next to `Style`, `Event`,
  and `Element` (`Property.Checked`, `Property.Placeholder`, `Property.Value`,
  `Property.Disabled`, …). Properties are single-valued.
- `@whuiy/dom` sets properties as DOM properties (`element.checked = true`) and
  patches them by token id. It also rebuilds the projection when an element's
  children or a flattened token's subtree changed, instead of leaving stale
  nodes behind.
- `@whuiy/dom`'s `renderToString` writes properties as HTML attributes.
- `@whuiy/react` passes properties as props and no longer gives void elements
  an empty children list.
- `@whuiy/codegen` lowers static property tokens to direct property writes.
- `examples/todo` is a runnable todo list: checkboxes toggle `Todos`, the draft
  input is cleared through `Property.Value`, and the count and strikethrough
  stay derived.
