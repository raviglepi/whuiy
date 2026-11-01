# Craft, as rules

Twelve design-engineering tips from [Craft](https://craft.gustavofior.com) by
Gustavo Fior, each encoded as a Cascade rule. The page is a gallery: every tip
shows a plain control next to one that opts into the rule, so you can see what
the rule actually does.

```sh
bunx vite          # http://localhost:5173
bun run build      # 142 kB, 46 kB gzip
```

There is no site to browse here, no essays, no chapters. The point is the
rules: each one states a design decision once and writes the value a
description declared. `NestedBox` derives an inner corner, `Metric` decides
which digits hold their width, `Framed` draws an edge inside an image.

## How a tip becomes a rule

A marker token wraps the element the rule styles, and the facts the rule reads
are that element's children. Everything the rule writes is a slot the
description already declared.

```ts
// The tip: an inner corner is the outer corner minus the gap.
.rule(NestedBox(Outer(), Padding()), function* (box) {
  const outer = asNumber(box.get(Outer).value(), 28);
  const padding = asNumber(box.get(Padding).value(), 12);
  const corner = Math.max(0, outer - padding);

  const frame = inner(box, Element.Div);
  yield* frame.get(Style.Padding).pipe(Token.setValue(padding + "px"));
  yield* frame.get(Style.BorderRadius).pipe(Token.setValue(outer + "px"));
  yield* frame
    .get(InnerBox).pipe(node => inner(node, Element.Div))
    .get(Style.BorderRadius).pipe(Token.setValue(corner + "px"));
})
```

The description that opts in:

```ts
NestedBox(
  Outer(40),
  Padding(20),
  Element.Div(
    Style.Padding("20px"),
    Style.BorderRadius("40px"),
    InnerBox(Element.Div(Style.BorderRadius("20px"))),
  ),
);
```

## The twelve

| Tip                  | Rule                              | What it derives                                              |
| -------------------- | --------------------------------- | ------------------------------------------------------------ |
| Nested Border Radius | `NestedBox(Outer(), Padding())`   | inner corner `max(0, outer − padding)`                       |
| Tabular Numbers      | `Metric(Reading(), Steady())`     | tabular or proportional figures, always from one reading     |
| Letter Spacing       | `Tightened(Size())`               | `-0.03em` at 24px and up, `0.01em` below                     |
| Text Wrapping        | `Balanced()`                      | `text-wrap: balance` on headings                             |
| Optical Alignment    | `Optical(Glyph())`                | the nudge each glyph needs, not a shared one                 |
| Image Outlines       | `Framed()`                        | 1px outline at 10% of the ink, `outline-offset: -1px`        |
| Shadows, Not Borders | `Edged()`                         | border off, layered shadow on                                |
| Hit Areas            | `Target()`                        | 44px control with a negative margin, so the layout stays put |
| Button Press         | `Pressable(Pressed())`            | `scale(0.97)` while pressed                                  |
| Hover Restraint      | `Tinted(Hovered())`               | an inset tint, so nothing moves                              |
| Scroll Fades         | `Faded(MoreAbove(), MoreBelow())` | the mask the scroll position implies                         |
| Interruptibility     | `Sliding(Moved(), Smooth())`      | one transition from the current value                        |

Pointer and scroll facts are written by handlers on the element: hovering a link
writes `Hovered`, pressing a button writes `Pressed`, scrolling writes
`MoreAbove`/`MoreBelow`. The rules above read those facts and write values.

## What this shape taught us

**Relations are undirected.** A node inside a `<div>` has two div relations: its
own child and its owner. `get` refuses ambiguity, so a path that crosses two
elements of the same tag needs a named layer. `inner()` in `src/facts.ts` takes
the node's own relation and says why.

**A token instance is a node.** Shared `as const` style tables alias every
element that spreads them. The helpers in `src/ui.ts` build fresh instances on
every call, so two cards have two border radii.

**A rule writes values into slots it already described.** Adding a relation on
every run changes the graph and re-runs the rule. The description carries the
`Style` slot; the rule sets its value.

**One rule per target.** Two rules may not write the same path on overlapping
conditions. That is why the press and hover tips use a button and a link: both
are pressable and hoverable in real interfaces, and their rules stay disjoint.

## Costs

142 kB of JavaScript (46 kB gzip), almost all of it the `effect` runtime; no
routing, one page. The rule set compiles in about a millisecond and mounts in
about ten.

## Credit

The tips are Gustavo Fior's, from [craft.gustavofior.com](https://craft.gustavofior.com).
This example paraphrases the principles and encodes them; it does not reproduce
the site. The two photographs are public-domain Monet paintings resized from
that site.
