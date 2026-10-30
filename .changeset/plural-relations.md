---
"whuiy": minor
"@whuiy/dom": minor
"@whuiy/react": minor
---

Relations are plural: a token can hold every relation, not only the last one per definition.

- `Button(Element.Span(Text("a")), Element.Span(Text("b")))` now mounts both
  spans in insertion order, so descriptions can carry lists.
- `get(target)` requires exactly one match and throws a describing error when a
  relation is ambiguous; `all(target)` returns every match.
- Single-valued definitions replace instead of accumulate and are declared with
  `Token("Opacity").single()`. Generated `Style` and `Event` tokens are single.
- Content is explicit: `Token("Text").content()` projects its value as a text
  node through every adapter, so state tokens such as `Count(0)` no longer leak
  into the DOM as text.
- The DOM renderer reports rule failures that happen during the initial mount
  and patches data-token changes instead of rebuilding the projection.
- `WhuiyRuntime.subscribeFailures` delivers failed rules synchronously, and
  `renderToString` throws instead of shipping markup from a broken rule.
- Rules re-evaluate only the nodes touched by a change, so a write inside one
  list row does not re-run rules for the other rows.
- The write path runs synchronously behind the Effect facade; a direct value
  write in a 1000-row DOM list dropped from ~2.5 ms to ~10 µs on this machine.
