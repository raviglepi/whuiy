import type {LiveToken} from "whuiy";
import {bench, describe} from "vitest";

import {Effect} from "effect";

import {Element, Style, Token, Whuiy} from "whuiy";
import {createDomRenderer} from "../src/index.ts";

const Row = Token("Row")();
const Text = Token("Text")<string>();
const Page = Token("Page")();
const Rows = 1000;

const tree = Element.Div(
  ...Array.from({length: Rows}, (_, index) =>
    Row(Element.Span(Text(`row ${index}`), Style.Padding("0.25rem"))),
  ),
);

function runtime() {
  return Effect.runSync(new Whuiy().make());
}

let live: LiveToken | undefined;
let writes = 0;

describe("patch one value", () => {
  bench("whuiy value write", () => {
    if (live === undefined) {
      const parent = document.createElement("main");
      const ui = new Whuiy().rule(Page(), function* (page) {
        live = page.get(Element.Span).get(Text);
      });
      const renderer = createDomRenderer({reportError: () => undefined, runtime: runtime()});
      renderer.render(parent, Page(Element.Span(Text("a"))));
      return;
    }
    writes += 1;
    Effect.runSync(live.pipe(Token.setValue(`row ${writes}`)));
  });
});
