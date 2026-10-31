import {describe, expect, it} from "vitest";

import {Effect} from "effect";

import {renderToStaticMarkup} from "react-dom/server";
import {Element, Token, Whuiy} from "whuiy";
import {createReactRenderer} from "../src/index.ts";

describe("React list projection", () => {
  it("renders siblings of one definition and content tokens", () => {
    const Text = Token("Text").content<string>();
    const Label = Token("Label")<string>();
    const Row = Token("Row")();
    const runtime = Effect.runSync(new Whuiy().make());
    const renderer = createReactRenderer({reportError: () => undefined, runtime});

    const html = renderToStaticMarkup(
      renderer.render(
        Element.Ul(
          Row(Label("hidden"), Element.Li(Text("a"))),
          Row(Label("hidden"), Element.Li(Text("b"))),
        ),
      ),
    );

    expect(html).toBe("<ul><li>a</li><li>b</li></ul>");
  });
});
