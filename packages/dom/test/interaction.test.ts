import type {LiveToken} from "whuiy";
import {describe, expect, it} from "vitest";

import {Effect} from "effect";

import {Element, Event, Style, Token, Whuiy} from "whuiy";
import {createDomRenderer} from "../src/index.ts";

const Count = Token("Count")<number>();
const Label = Token("Label")<string>();
const Text = Token("Text")<string>();
const Counter = Token("Counter")();
const Increment = Token("Increment")();

function increment(token: LiveToken): Effect.Effect<void> {
  const count = token.get(Count).value() ?? 0;
  return token.get(Count).pipe(Token.setValue(count + 1));
}

function counter(): Whuiy {
  return new Whuiy()
    .rule(Counter(), function* (token) {
      const button = token.get(Increment).get(Element.Button);
      yield* button.pipe(
        Token.add(
          Event.OnClick(() =>
            token.get(Count).pipe(Token.setValue((token.get(Count).value() ?? 0) + 1)),
          ),
        ),
      );
    })
    .rule(Counter(Count()), function* (token) {
      yield* token
        .get(Element.P)
        .get(Label)
        .pipe(Token.setValue(String(token.get(Count).value())));
    });
}

function find(parent: HTMLElement, selector: string): HTMLElement {
  const element = parent.querySelector<HTMLElement>(selector);
  if (element === null) throw new Error(`Missing ${selector}`);
  return element;
}

describe("interactive updates", () => {
  it("turns a click into a patched label without replacing nodes", () => {
    const parent = document.createElement("main");
    const runtime = Effect.runSync(counter().make());
    const renderer = createDomRenderer({reportError: () => undefined, runtime});

    renderer.render(
      parent,
      Counter(
        Count(0),
        Element.P(Label("0")),
        Increment(Element.Button(Text("+"), Style.Padding("0.5rem"))),
      ),
    );

    const paragraph = find(parent, "p");
    const button = find(parent, "button");
    expect(paragraph.textContent).toBe("0");

    button.dispatchEvent(new MouseEvent("click", {bubbles: true}));

    expect(parent.querySelector("p")).toBe(paragraph);
    expect(paragraph.textContent).toBe("1");
    expect(button.style.padding).toBe("0.5rem");
  });
});
