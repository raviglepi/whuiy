import {bench, describe} from "vitest";

import {Effect} from "effect";

import {Element, Style, Token, Whuiy} from "whuiy";
import {createDomRenderer} from "../src/index.ts";

const Row = Token("Row")();
const Label = Token("Label")<string>();
const Text = Token("Text")<string>();
const Page = Token("Page")();
const ROWS = 1000;
const noop = (): undefined => undefined;

const tree = Element.Div(
  ...Array.from({length: ROWS}, (_, index) =>
    Row(Label(`row ${index}`), Element.Span(Text(`row ${index}`), Style.Padding("0.25rem"))),
  ),
);
const page = Page(tree);
const ui = new Whuiy().rule(Row(Label()), function* (row) {
  yield* row
    .get(Element.Span)
    .get(Text())
    .pipe(Token.setValue(String(row.get(Label).value())));
});

const runtime = Effect.runSync(ui.make());
const parent = document.createElement("main");
const renderer = createDomRenderer({reportError: noop, runtime});
renderer.render(parent, page);
const mounted = Effect.runSync(runtime.mount(page));
const div = mounted.roots[0]!.get(Element.Div);
const row = div.all(Row)[0]!;
const live = row.get(Element.Span).get(Text);
const liveLabel = row.get(Label);
const raw = parent.querySelector("span")!.firstChild;
if (!(raw instanceof globalThis.Text)) throw new Error("Expected a raw text node");

let writes = 0;

describe("write paths in a 1000-row list", () => {
  bench("raw dom text update", () => {
    writes += 1;
    raw.data = `row ${writes}`;
  });

  bench("whuiy text write", () => {
    writes += 1;
    Effect.runSync(live.pipe(Token.setValue(`row ${writes}`)));
  });

  bench("whuiy derived write through a rule", () => {
    writes += 1;
    Effect.runSync(liveLabel.pipe(Token.setValue(`row ${writes}`)));
  });

  bench("whuiy mount + project 1000 rows", () => {
    const target = document.createElement("main");
    const fresh = Effect.runSync(new Whuiy().make());
    const freshRenderer = createDomRenderer({reportError: noop, runtime: fresh});
    freshRenderer.render(target, page);
  });
});
