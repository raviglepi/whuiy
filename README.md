# Whuiy

Whuiy describes a user interface as a graph of facts and the rules that follow
from them. Adapters project that graph into React or plain DOM. A compiler
lowers the rules to per-element plans, the static parts of a page render to HTML
at build time, a declarative tier compiles certain programs to manual DOM code
with no runtime at all, and the browser patches only the nodes whose tokens
changed.

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

### Writing to the graph

`add` appends a relation, `del` removes every outgoing relation that matches a
pattern, and `set` replaces the whole relation set with the terms you pass.
Rules that derive a child list should use `set`:

```ts
yield * box.pipe(Token.set(Row(Text("a")), Row(Text("b"))));
```

`set` compares the desired terms structurally, so re-running the rule with the
same rows changes nothing. `add` is for slots and one-off attachments; a rule
that appends a fresh relation on every run will grow its node.

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

## Compiled to manual DOM code

`@whuiy/codegen` goes one step further. A program declares its state cells,
event rules, derived text, visibility, dynamic styles, and list regions, and
`compile` lowers all of it to a self-contained module — no rules, no dispatch
tables, no `whuiy` import:

```ts
const program = define(
  {description, runtime: "./handlers.ts", state: [Count(0), Query(""), Theme("light")] as const},
  rules => [
    rules.on(Increment, Event.OnClick, handleIncrement),
    rules.on(Search, Event.OnInput, handleQuery),
    rules.derive(Label, [Count], labelText),
    rules.list(Rows, [Query], filterRows),
    rules.show(Results, [Query], hasMatches),
    rules.style(Section, Style.BackgroundColor, [Theme], themeBackground),
  ],
);
```

The generated `mount(parent)` is what a person would have written by hand:

```ts
export function mount(parent: HTMLElement): () => void {
  let count = 0;
  let query = "";
  const section = document.createElement("section");
  section.style.display = "grid";
  // … elements, styles, text nodes …
  button.addEventListener("click", () => {
    Effect.runFork(handleIncrement(setters));
  });
  input.addEventListener("input", event => {
    Effect.runFork(handleQuery(setters, event));
  });
  function updateLabel(): void {
    label.data = String(labelText({count}));
  }
  function updateRows(): void {
    ul.replaceChildren(...filterRows({query}).map(createRow));
  }
  const setters = {
    count: {
      set: (next: number): void => {
        count = next;
        updateLabel();
      },
      // …
    },
    // …
  };
  updateLabel();
  updateRows();
  return () => {
    parent.removeChild(section);
  };
}
```

The compiler computes which updates each setter calls from the declared
dependencies, so propagation is plain function calls. Handlers and mappers are
imported from the program's `runtime` module, which imports only `effect`;
nothing from `whuiy` reaches the bundle. Listeners run handlers with
`Effect.runFork`, so a synchronous handler updates the DOM before the event
dispatch returns and an asynchronous one keeps running on the runtime.

`examples/manual` is the counter, theme toggle, double (async), and filtered
list above. Its committed `src/generated.ts` is checked by
`bun run generate --check` and typechecked in the example build. The built app
is 32.6 kB (11.5 kB gzip): the async handler pulls in Effect's clock and
scheduler, and none of it is `whuiy`. The compiler rejects
descriptions it cannot lower honestly: static event tokens, ambiguous targets,
styles on non-element tokens, list templates without exactly one content token,
and targets that sit inside another list's template.

The trade is explicit: the declarative form supports the rule shapes the
compiler understands, while the runtime engine still handles arbitrary rule
generators.

## Packages

| Package          | What it does                                              |
| ---------------- | --------------------------------------------------------- |
| `whuiy`          | Tokens, rules, the graph runtime, and the rule compiler   |
| `@whuiy/dom`     | Retained-DOM rendering and static HTML                    |
| `@whuiy/react`   | React projection, error boundary, and atom-backed updates |
| `@whuiy/codegen` | Declarative rules lowered to plain DOM and Effect code    |

## Vocabulary

`Style`, `Event`, and `Element` are generated from the platform's own type
declarations (`lib.dom.d.ts`), not hand-written lists. `bun run generate`
regenerates `packages/core/src/generated/platform.ts`; `bun run generate:check`
fails when the committed file is stale.

Event tokens are named after DOM event types: `Event.Click`,
`Event.Pointerdown`. Style tokens use the CSS property in PascalCase:
`Style.BackgroundColor`, `Style.FlexWrap`. Element tokens cover
`HTMLElementTagNameMap`: `Element.Div`, `Element.Button`, `Element.Dialog`.
Property tokens cover writable primitive platform properties:
`Property.Checked`, `Property.Placeholder`, `Property.Value`, `Property.Disabled`.
Adapters set them as DOM properties, HTML attributes, or React props.

### Why the vocabulary is generated by parsing, not reflecting

`bun run generate` reads `lib.dom.d.ts` with the TypeScript parser. TS 7.1
content mappers are a virtual-file hook for embedded regions such as `.vue` or
`.mdx` sources, not a reflection API, and TypeScript 7 ships without the JS
compiler API. A typesugar-style `typeInfo` reflection would add a compiler
dependency for a list the platform already ships, so the generator parses the
declaration file instead and CI fails when the committed vocabulary is stale.

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

`examples/todo` is the same model on a todo list: checkboxes carry
`Property.Checked`, the row list is replaced from `Todos` whenever it changes,
the draft input is a controlled `Property.Value`, and the count plus the
strikethrough are derived rules. The todo description is also what drove the
`Property` family and the renderer's structural-change detection.

## Performance

Benchmarks live in `packages/dom/bench` and `packages/react/bench`:

```sh
bunx vitest bench dom/bench --project dom
bunx vitest bench react/bench --project dom
```

On a 1000-row list, on this machine, under happy-dom (host load made runs vary
1.5–2×; the update paths stayed under 50 µs across runs):

| Operation                             | Whuiy     | React 19 |
| ------------------------------------- | --------- | -------- |
| update one text node                  | 9–14 µs   | —        |
| update one row through a derived rule | 20–44 µs  | 10 ms    |
| mount and project 1000 rows           | 87–150 ms | 114 ms   |

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
