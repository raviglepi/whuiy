# Craft, described

A working encoding of [Craft](https://craft.gustavofior.com), Gustavo Fior's
collection of design engineering essays, as one Cascade description.

```sh
bunx vite          # http://localhost:5173
bun run build      # 205 kB, 66 kB gzip
```

The eleven published essays, the chapter index, the search sheet, the theme
switch, and six interactive demos are all facts and rules. There is no
component tree, no class list, and no template language: the page is a
description of what the site is, and the rules say what follows from it.

## The shape of the description

```
Craft(Theme, Route, Narrow)
  Body(Div)                     the canvas: colours, type, color-scheme
    Chrome(Header)              wordmark, search trigger, theme switch
    Layout(Div)                 the two-column grid
      Sidebar(Aside)            top nav and the chapter index
      Main(Stack)               fourteen pages, one visible
        Page(Slug, Route, ...)  the index, GOATs, resources, eleven essays
    Sheet(...)                  the command palette
```

Three facts move the document, and each is written once:

- **Theme** sets `color-scheme` on the canvas. Every colour in the palette is a
  `light-dark()` pair, so the second palette is not a second description.
- **Route** fills a `Route` slot in every page and every nav entry. A page shows
  when its slug equals its route; an entry is lit the same way.
- **Narrow** is a `matchMedia` fact. The layout, sidebar, and chapter list follow
  it.

The search query lives inside the sheet. Every result row is described up front
and carries its own copy of the query; the sheet copies the typed value into
them, and a row hides itself when the query does not name it. Nothing is
rebuilt while you type.

## Where the essays' advice goes

Each essay is prose plus a demo, and the demo is the rule the essay describes:

| Concept                                                                 | What the rule says                                                                                                  |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Nested Border Radius                                                    | the inner corner is `max(0, outer − padding)`; dragging either slider re-derives it                                 |
| Image Outlines                                                          | an image is outlined `1px` `currentColor` at the chosen strength, drawn inside with `outline-offset: -1px`          |
| Tabular Numbers                                                         | two readings of the same value; the tabular one keeps its width while the digits change                             |
| Button Press                                                            | a pressed control scales to `0.97` and returns; the scale is a fact, not a selector                                 |
| Hover Restraint                                                         | hover tints the surface through an inset shadow, so no layout value changes                                         |
| Interruptibility                                                        | the mover's transform is a value with one transition, so reversing mid-move is a new transition from wherever it is |
| Noise, Scroll Fades, HTML Background, Optical Alignment, Font Smoothing | static specimens with the same treatment, drawn from the same palette                                               |

`src/content.ts` holds the prose, captured from the site. `src/design.ts` holds
the palette and the type stack. `src/tokens.ts` names the concepts.
`src/app.ts` is the description and the rule set; `src/demos.ts` builds the
specimens.

## What this example learned about the engine

Writing a real page surfaced four behaviours worth knowing before describing a
site this size.

**Relations are undirected.** A node inside a `<div>` has two div relations: its
own child and its owner. `get` refuses ambiguity, so a path that crosses two
divs has to go through a named layer. `inner()` in `src/app.ts` takes the node's
own relation and documents why: a node's relations are listed before its
owner's.

**A token instance is a node.** A shared `as const` table of `Style` tokens is
one node with many owners, so every page would share one `display` fact. The
helpers in `src/ui.ts` build fresh instances on every call. This is also what
makes the route work: fourteen pages need fourteen display slots.

**A rule must write values into slots it already described.** Adding a new
relation on every run changes the graph, which re-runs the rule, which adds
another relation. The description carries the `Style` slot, the rule writes its
value. `Token.set` is the exception: it compares structurally, so replacing a
list with an equal list changes nothing.

**A rule's condition should name everything the body needs.** Rules run while a
tree is being mounted, so a page rule that wants its `<main>` asks for it:
`Page(Slug(), Route(), Element.Main())`. Without that, the rule runs on the
page before the element is attached and never runs again.

The example also drove one adapter change: `render()` now returns the `mount` it
owns, so `main.ts` can write the route, the viewport flag, and the sheet's open
state without mounting the description twice.

## Costs, stated plainly

The build is 205 kB (66 kB gzip), almost all of it the `effect` runtime plus the
essay text. Compiling the rule set takes 6 ms; mounting the graph takes about
50 ms on this machine; a cold first paint in `vite preview` lands around 350 ms.
Every page is described and mounted, and the hidden ones stay in the DOM: about
1,200 elements. A static build of the index alone would be smaller. The
trade is that a route change is a value write, not a re-render.

## Provenance

The prose, titles, taglines, resources, and structure come from
[craft.gustavofior.com](https://craft.gustavofior.com/craft) by Gustavo Fior,
captured page by page. The three photographs in the image-outlines demo are
public-domain Monet paintings resized from that site. The site's own interactive
demos, sound chapter, and preview illustrations are not reproduced; entries that
the site marks "Soon" stay "Soon" here.
