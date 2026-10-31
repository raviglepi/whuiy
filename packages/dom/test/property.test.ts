import type {LiveToken} from "whuiy";
import {describe, expect, it} from "vitest";

import {Effect} from "effect";

import {Element, Property, Token, Whuiy} from "whuiy";
import {createDomRenderer, renderToString} from "../src/index.ts";

describe("property tokens", () => {
  it("applies a property during projection and patches it later", () => {
    const App = Token("App")();
    let live: LiveToken | undefined;
    const ui = new Whuiy().rule(App(), function* (app) {
      live = app.get(Element.Input).all(Property.Value)[0];
    });
    const runtime = Effect.runSync(ui.make());
    const parent = document.createElement("main");
    const renderer = createDomRenderer({reportError: () => undefined, runtime});
    renderer.render(parent, App(Element.Input(Property.Value("initial"))));

    const input = parent.querySelector("input");
    if (input === null) throw new Error("Expected the input");
    expect(input.value).toBe("initial");

    Effect.runSync(live!.pipe(Token.setValue("patched")));

    expect(input.value).toBe("patched");
  });

  it("renders properties as attributes in static HTML", () => {
    const html = renderToString(
      new Whuiy(),
      Element.Input(
        Property.Type("checkbox"),
        Property.Checked(true),
        Property.Disabled(false),
        Property.Placeholder("done?"),
      ),
    );

    expect(html).toBe('<input type="checkbox" checked placeholder="done?">');
  });
});
