import type {LiveToken} from "whuiy";
import {describe, expect, it} from "vitest";

import {Effect} from "effect";

import {Element, Event, Style, Token, Whuiy} from "whuiy";
import {createDomRenderer} from "../src/index.ts";

const Count = Token("Count")<number>();
const Label = Token("Label").content<string>();
const Text = Token("Text").content<string>();
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
  it("patches a write that arrives from a later async effect", async () => {
    const Count = Token("Count")<number>();
    const Text = Token("Text").content<string>();
    const Counter = Token("Counter")();
    const ui = new Whuiy().rule(Counter(Count()), function* (counter) {
      yield* counter
        .get(Element.P)
        .get(Text)
        .pipe(Token.setValue(String(counter.get(Count).value() ?? 0)));
    });
    const runtime = Effect.runSync(ui.make());
    const parent = document.createElement("main");
    const renderer = createDomRenderer({reportError: () => undefined, runtime});
    const description = Counter(Count(0), Element.P(Text("0")));

    renderer.render(parent, description);
    const mounted = Effect.runSync(runtime.mount(description));
    const paragraph = find(parent, "p");
    expect(paragraph.textContent).toBe("0");

    await Effect.runPromise(
      Effect.gen(function* () {
        yield* Effect.sleep("1 millis");
        yield* mounted.roots[0]!.get(Count).pipe(Token.setValue(1));
      }),
    );

    expect(parent.querySelector("p")).toBe(paragraph);
    expect(paragraph.textContent).toBe("1");
  });

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
