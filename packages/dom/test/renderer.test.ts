import type {LiveToken} from "whuiy";
import {describe, expect, it} from "vitest";

import {Effect} from "effect";

import {Element, Event, Style, Token, Whuiy} from "whuiy";
import {createDomRenderer} from "../src/index.ts";

describe("DOM renderer", () => {
  it("renders native elements, runs event effects, and disposes its projection", () => {
    const runtime = Effect.runSync(new Whuiy().make());
    const parent = document.createElement("main");
    let clicks = 0;
    const renderer = createDomRenderer({reportError: () => undefined, runtime});

    const rendered = renderer.render(
      parent,
      Element.Div(
        Element.Button(
          Style.Color("navy"),
          Event.OnClick(() => Effect.sync(() => clicks++)),
        ),
      ),
    );

    const button = parent.querySelector("div > button");
    expect(button).toBeInstanceOf(HTMLButtonElement);
    if (!(button instanceof HTMLButtonElement)) throw new Error("Expected a button");
    expect(button.style.color).toBe("navy");

    button.dispatchEvent(new MouseEvent("click", {bubbles: true}));
    expect(clicks).toBe(1);

    rendered.dispose();
    expect(parent.childElementCount).toBe(0);
  });
});

function find(parent: HTMLElement, selector: string): HTMLElement {
  const element = parent.querySelector<HTMLElement>(selector);
  if (element === null) throw new Error(`Missing ${selector}`);
  return element;
}

describe("DOM patching", () => {
  it("updates text without replacing the element", () => {
    const Text = Token("Text")<string>();
    const Panel = Token("Panel")();
    let live: LiveToken | undefined;
    const ui = new Whuiy().rule(Panel(), function* (panel) {
      live = panel.get(Element.P).get(Text);
    });
    const runtime = Effect.runSync(ui.make());
    const parent = document.createElement("main");
    const renderer = createDomRenderer({reportError: () => undefined, runtime});

    renderer.render(parent, Panel(Element.P(Text("a"))));
    const paragraph = find(parent, "p");
    expect(paragraph.textContent).toBe("a");
    if (live === undefined) throw new Error("Expected a captured token");

    Effect.runSync(live.pipe(Token.setValue("b")));

    expect(parent.querySelector("p")).toBe(paragraph);
    expect(paragraph.textContent).toBe("b");
  });
});
