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
});
