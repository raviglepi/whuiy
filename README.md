# Whuiy

Whuiy describes a user interface as a graph of facts and the rules that follow
from them. Adapters project that graph into React or plain DOM. A compiler
lowers the rules to per-element plans, and the static parts of a page can be
rendered to HTML at build time, so the browser ships markup instead of a
framework.

```ts
import {Effect} from "effect";

import {Token, Whuiy} from "whuiy";

const Disabled = Token("Disabled")();
const Button = Token("Button")();
const Opacity = Token("Opacity")<number>();

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
- A **relation** is a token instance inside another one. Relations are what
  makes `Button(Disabled())` true.
- A **rule** matches a condition on a definition and writes derived tokens. It
  yields typed writes, so the compiler can see what it changes.
- An **adapter** reads the mounted graph and produces something a browser can
  show. `@whuiy/react` produces React elements. `@whuiy/dom` produces DOM nodes
  and patches only the nodes whose tokens changed.

The Canon idea behind this: a program should describe the concepts it works
with, how they relate, and why an operation follows. Whuiy is the UI-sized
version of that, built to exist today in TypeScript rather than to wait for a
language.

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

## Static output

Rule bodies are ordinary Effect generators, so they cannot in general be erased.
What can be erased is everything they produce for a description that does not
change: mount the graph at build time, run the rules to a fixed point, serialize,
and ship the result.

```ts
import {comptime} from "comptime";

import {renderToString} from "@whuiy/dom";

const html = comptime(() => renderToString(ui, Button(Disabled(), Opacity(1))));
```

With the `comptime` Vite plugin, `html` becomes a string literal in the bundle.
The tokens, rules, and runtime for that subtree never reach the browser.

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

`examples/playground` is a counter with a theme toggle. Buttons write through
rules, the label is derived from `Count`, and the DOM renderer patches the text
node in place. Nothing re-renders a tree.

```sh
cd examples/playground && bunx vite
```

The same loop is covered by `packages/dom/test/interaction.test.ts`: a click
changes `Count`, a rule rewrites `Label`, and the `<p>` keeps its identity while
its text changes.

## Performance

There is a benchmark in `packages/dom/bench` (`bunx vitest bench dom/bench
--project dom`). It measures one value write through the runtime, the graph
change stream, and the DOM patch.

Current numbers on this machine: about 37 writes per second, 26 ms mean, 1.7 ms
best case. That is not acceptable. The cost is the Effect stream hop and drain
per write, not the DOM patch. The next performance step is a synchronous change
channel for adapters (a `Ref`-backed listener list instead of
`SubscriptionRef` plus `Stream`), which should take a write under a millisecond.
Mount and projection throughput are not measured correctly yet; the bench file
needs a per-iteration runtime so the comparison against hand-written DOM holds.

## Development

```sh
bun install
bun run check   # format, generated files, lint, tests, docs, build
```

Lint and formatting follow the shared Lounge configuration. The complexity
limit is three per function, and the Effect rules are errors. A lint failure is
treated as a design problem, not a formatting annoyance.
