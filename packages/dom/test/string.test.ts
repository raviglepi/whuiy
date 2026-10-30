import {describe, expect, it} from "@effect/vitest";

import {Element, Style} from "whuiy/primitives";
import {Token, Whuiy} from "whuiy";
import {renderToString} from "../src/string.ts";

const Text = Token("Text").content<string>();

describe("static HTML rendering", () => {
  it("renders nested elements, styles, and text", () => {
    const html = renderToString(
      new Whuiy(),
      Element.Div(Style.Color("red"), Element.Button(Text("Save"))),
    );

    expect(html).toBe('<div style="color:red"><button>Save</button></div>');
  });

  it("runs rules before serializing", () => {
    const Disabled = Token("Disabled")();
    const Opacity = Token("Opacity")<number>();
    const ui = new Whuiy().rule(Element.Button(Disabled()), function* (button) {
      yield* button.get(Style.Opacity()).pipe(Token.setValue(0.5));
    });

    expect(renderToString(ui, Element.Button(Disabled(), Style.Opacity(1)))).toBe(
      '<button style="opacity:0.5"></button>',
    );
  });

  it("escapes text", () => {
    expect(renderToString(new Whuiy(), Element.P(Text("<script>")))).toBe("<p>&lt;script&gt;</p>");
  });

  it("self-closes void elements", () => {
    expect(renderToString(new Whuiy(), Element.Br(Style.Margin("1rem")))).toBe(
      '<br style="margin:1rem">',
    );
  });

  it("throws when a rule fails while rendering", () => {
    const Item = Token("Item")();
    const ui = new Whuiy().rule(Item(), function* () {
      throw new Error("boom");
    });

    expect(() => renderToString(ui, Item())).toThrow(/Rule Item\.1 failed while rendering/);
  });
});
