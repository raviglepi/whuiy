---
"@whuiy/dom": minor
---

Return the mount a DOM projection owns.

- `render(parent, ...roots)` still returns `dispose()`, and now also exposes
  the `mount` it created. A page that has to write a fact after boot — a route
  from `hashchange`, a viewport flag from `matchMedia`, a keyboard shortcut —
  can reach its root tokens without mounting the description a second time.
- `examples/craft` uses it to write the route and the narrow flag, and to focus
  the search input when the sheet opens.
