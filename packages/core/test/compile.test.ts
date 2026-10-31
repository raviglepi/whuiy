import {describe, expect, it} from "@effect/vitest";

import {Effect} from "effect";

import {Not, Token, Whuiy} from "../src/index.ts";

describe("rule compilation", () => {
  it("lowers a rule into plans for only the definitions it can reach", () => {
    const Disabled = Token("Disabled")();
    const Button = Token("Button")();
    const Input = Token("Input")();
    const Opacity = Token("Opacity")<number>();
    const program = new Whuiy()
      .rule(Button(Disabled()), function* (button) {
        yield* button.get(Opacity()).pipe(Token.setValue(0.5));
      })
      .compile();

    expect(program.plansFor(Button).map(plan => plan.name)).toEqual(["Button.1"]);
    expect(program.plansFor(Input)).toEqual([]);
    expect(program.explain(Button)).toEqual(["Button.1: Button + Disabled"]);
  });

  it("explains a negated condition", () => {
    const Ghost = Token("Ghost")();
    const Button = Token("Button")();
    const Opacity = Token("Opacity")<number>();
    const program = new Whuiy()
      .rule(Button(Not(Ghost())), function* (button) {
        yield* button.get(Opacity()).pipe(Token.setValue(0.5));
      })
      .compile();

    expect(program.explain(Button)).toEqual(["Button.1: Button -Ghost"]);
  });

  it("keeps compiled dispatch behavior", () => {
    const Disabled = Token("Disabled")();
    const Button = Token("Button")();
    const Opacity = Token("Opacity")<number>();
    let runs = 0;
    const runtime = Effect.runSync(
      new Whuiy()
        .rule(Button(Disabled()), function* (button) {
          runs += 1;
          yield* button.get(Opacity()).pipe(Token.setValue(0.5));
        })
        .make(),
    );
    const mounted = Effect.runSync(runtime.mount(Button(Disabled(), Opacity(1))));

    expect(runs).toBe(1);
    expect(mounted.roots[0]?.get(Opacity).value()).toBe(0.5);
    Effect.runSync(mounted.release);
  });

  it("re-runs a matching rule when a token value changes", () => {
    const Count = Token("Count")<number>();
    const Page = Token("Page")();
    const Label = Token("Label")<string>();
    let runs = 0;
    const runtime = Effect.runSync(
      new Whuiy()
        .rule(Page(Count()), function* (page) {
          runs += 1;
          yield* page.get(Label()).pipe(Token.setValue(`count ${page.get(Count).value()}`));
        })
        .make(),
    );
    const mounted = Effect.runSync(runtime.mount(Page(Count(1), Label(""))));

    expect(runs).toBe(1);
    Effect.runSync(mounted.roots[0]!.get(Count).pipe(Token.setValue(2)));
    expect(runs).toBe(2);
    expect(mounted.roots[0]!.get(Label).value()).toBe("count 2");
    Effect.runSync(mounted.release);
  });
});
