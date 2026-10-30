# Whuiy

Whuiy describes a user interface as a graph of facts and the rules that follow
from them. Adapters project that graph into React or plain DOM. A compiler
lowers the rules to per-element plans, the static parts of a page render to HTML
at build time, and the browser patches only the nodes whose tokens changed.

```ts
import {Effect} from "effect";

import {Token, Whuiy} from "whuiy";

const Disabled = Token("Disabled")();
const Button = Token("Button")();
const Opacity = Token("Opacity").single<number>();

const ui = new Whuiy().rule(Button(Disabled()), function* (button) {
  yield* button.get(Opacity()).pipe(Token.setValue(0.5));
});

const runtime = Effect.runSync(ui.make());
const page = Effect.runSync(runtime.mount(Button(Disabled(), Opacity(1))));

console.log(page.roots[0]?.get(Opacity).value()); // 0.5
```

Nothing in that example describes a button element, a prop, or a re-render.
The rule says what a disabled button means, and the adapter decides how to show
it.

## The model

- A **token definition** names a kind of fact: `Button`, `Disabled`, `Color`.
- A **token instance** says that fact holds, optionally with a value:
  `Button(Disabled(), Color("red"))`.
- A **relation** is a token instance inside another one. Relations are plural:
  `Element.Div(Element.Span(Text("a")), Element.Span(Text("b")))` mounts both
  spans, in insertion order, so a description can carry lists.
- A **rule** matches a condition on a definition and writes derived tokens. It
  yields typed writes, so the compiler can see what it changes.
- An **adapter** reads the mounted graph and produces something a browser can
  show. `@whuiy/react` produces React elements. `@whuiy/dom` produces DOM nodes
  and patches only the nodes whose tokens changed.

The Canon idea behind this: a program should describe the concepts it works
with, how they relate, and why an operation follows. Whuiy is the UI-sized
version of that, built to exist today in TypeScript rather than to wait for a
language.

### Looking up relations

`get` requires exactly one match. A relation that is ambiguous is an error that
tells you to disambiguate:

```ts
div.get(Element.Span); // Error: Token Div#3 has 2 Span relations; use all(Span) …
div.all(Element.Span); // [spanA, spanB]
```

`all` returns every match in insertion order. Rule conditions are the plural
form: `new Whuiy().rule(Row(Label()), handler)` runs once per matching `Row`.

### Cardinality and content

Two declarations change how a definition behaves in the graph and in adapters:

```ts
const Opacity = Token("Opacity").single<number>(); // replaces its previous relation
const Text = Token("Text").content<string>(); // projects its value as text
```

`Style` and `Event` tokens are single by definition. Data tokens such as
`Count(0)` are neither, so they stay in the graph and never leak into markup as
text.

## Compiled rules

`Whuiy.compile()` lowers the rule set to per-element dispatch tables. A runtime
created from a compiled program never tests a `Button` against rules written for
`Input`; each element checks only the rules that can reach its definition.

```ts
const program = ui.compile();

program.explain(Button); // ["Button.1: Button + Disabled"]
```

`make()` compiles internally, so the builder API stays the same. Call `compile()`
directly when you want to inspect the plan or hand it to a custom adapter.

Rules re-evaluate only the nodes touched by a change: a value write inside one
list row runs the rules for that row, not for the other rows. A rule runs again
for a node when the node itself changed, or when a token in its subtree changed.

## Static output

Rule bodies are ordinary Effect generators, so they cannot in general be erased.
What can be erased is everything they produce for a description that does not
change: mount the graph at build time, run the rules to a fixed point, serialize,
and ship the result.

`examples/static` does exactly that:

```ts
import {comptime} from "comptime";

import {renderToString} from "@whuiy/dom";
import {page, ui} from "./page.ts";

const html = comptime(() => renderToString(ui, page));
```

`bun run build` in that folder turns the description and its rules into a 1.4 kB
script containing the finished HTML — no `whuiy`, no `effect`, no runtime. The
sale rule in the example runs at build time and its derived price and border
color are part of the shipped markup.

The remaining cost for a partially dynamic page is honest: the runtime mounts in
the browser. Only descriptions that do not change erase completely.

## Packages

| Package        | What it does                                              |
| -------------- | --------------------------------------------------------- |
| `whuiy`        | Tokens, rules, the graph runtime, and the rule compiler   |
| `@whuiy/dom`   | Retained-DOM rendering and static HTML                    |
| `@whuiy/react` | React projection, error boundary, and atom-backed updates |

## Vocabulary

`Style`, `Event`, and `Element` are generated from the platform's own type
declarations (`lib.dom.d.ts`), not hand-written lists. `bun run generate`
regenerates `packages/core/src/generated/platform.ts`; `bun run generate:check`
fails when the committed file is stale.

Event tokens are named after DOM event types: `Event.Click`,
`Event.Pointerdown`. Style tokens use the CSS property in PascalCase:
`Style.BackgroundColor`, `Style.FlexWrap`. Element tokens cover
`HTMLElementTagNameMap`: `Element.Div`, `Element.Button`, `Element.Dialog`.

## Playground

`examples/playground` is a counter with a theme toggle and a filtered 500-row
list. Buttons write through rules, the label is derived from `Count`, typing in
the search input writes `Query`, and a rule replaces the visible rows through
`Token.set`.

```sh
cd examples/playground && bunx vite
```

The same loops are covered by `packages/dom/test`: a click changes `Count` and
the `<p>` keeps its identity while its text changes; filtering the playground
list updates the visible rows.

## Performance

Benchmarks live in `packages/dom/bench` and `packages/react/bench`:

```sh
bunx vitest bench dom/bench --project dom
bunx vitest bench react/bench --project dom
```

On a 1000-row list, on this machine, under happy-dom:

| Operation                             | Whuiy  | React 19 |
| ------------------------------------- | ------ | -------- |
| update one text node                  | 8.7 µs | —        |
| update one row through a derived rule | 20 µs  | 10 ms    |
| mount and project 1000 rows           | 87 ms  | 114 ms   |

The React row is a `memo`-wrapped row whose props change; the plain React row
update is 22 ms. Raw `textNode.data` assignment is 0.5 µs, so the Whuiy number
is the cost of the write path and one DOM patch, not a claim of free work.

The remaining costs, stated plainly: the engine executes rule generators through
`Effect.runSyncExit` once per rule invocation, and mounting a list projects every
row. Neither is a framework problem, but neither is done being optimized.

## Development

```sh
bun install
bun run check   # format, generated files, lint, tests, docs, build
```

Lint and formatting follow the shared Lounge configuration: complexity 3 per
function, the Effect rules as errors, and the readability plugins. A lint failure
is treated as a design problem, not a formatting annoyance.
