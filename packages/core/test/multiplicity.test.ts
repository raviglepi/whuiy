import type {LiveToken} from "../src/index.ts";
import {describe, expect, it} from "@effect/vitest";

import {Effect} from "effect";

import {Element, Token, Whuiy} from "../src/index.ts";

describe("plural relations", () => {
  it.effect("keeps sibling relations with the same definition in insertion order", () =>
    Effect.gen(function* () {
      const Text = Token("Text")<string>();
      const runtime = yield* new Whuiy().make();
      const mounted = yield* runtime.mount(
        Element.Div(Element.Span(Text("a")), Element.Span(Text("b"))),
      );

      const spans = mounted.roots[0]!.all(Element.Span);
      expect(spans.map(span => span.get(Text).value())).toEqual(["a", "b"]);
      expect(mounted.roots[0]!.tokens()).toHaveLength(2);

      yield* mounted.release;
    }),
  );

  it.effect("reports an ambiguous singular lookup and resolves it through all", () =>
    Effect.gen(function* () {
      const Text = Token("Text")<string>();
      const runtime = yield* new Whuiy().make();
      const mounted = yield* runtime.mount(
        Element.Div(Element.Span(Text("a")), Element.Span(Text("b"))),
      );
      const root = mounted.roots[0]!;

      expect(() => root.get(Element.Span)).toThrow(/has 2 Span relations/);
      expect(root.all(Element.Span)).toHaveLength(2);

      yield* mounted.release;
    }),
  );

  it.effect("reruns a rule only for the row whose dependency changed", () =>
    Effect.gen(function* () {
      const Label = Token("Label")<string>();
      const Text = Token("Text")<string>();
      const Row = Token("Row")();
      const List = Token("List")();
      let runs = 0;
      const ui = new Whuiy().rule(Row(Label()), function* (row) {
        runs += 1;
        yield* row.get(Text()).pipe(Token.setValue(String(row.get(Label).value())));
      });
      const runtime = yield* ui.make();
      const mounted = yield* runtime.mount(
        List(Row(Label("a"), Text("")), Row(Label("b"), Text("")), Row(Label("c"), Text(""))),
      );
      const rows = mounted.roots[0]!.all(Row);

      expect(runs).toBe(3);
      expect(rows.map(row => row.get(Text).value())).toEqual(["a", "b", "c"]);

      yield* rows[1]!.get(Label).pipe(Token.setValue("z"));

      expect(runs).toBe(4);
      expect(rows.map(row => row.get(Text).value())).toEqual(["a", "z", "c"]);

      yield* mounted.release;
    }),
  );

  it.effect("does not rerun a rule when an unrelated relation is added", () =>
    Effect.gen(function* () {
      const Color = Token("Color")<string>();
      const Opacity = Token("Opacity")<number>();
      const Disabled = Token("Disabled")();
      const Button = Token("Button")();
      let runs = 0;
      const ui = new Whuiy().rule(Button(Disabled()), function* (button) {
        runs += 1;
        yield* button.get(Opacity()).pipe(Token.setValue(0.5));
      });
      const runtime = yield* ui.make();
      const mounted = yield* runtime.mount(Button(Disabled(), Opacity(1)));

      yield* mounted.roots[0]!.pipe(Token.add(Color("red")));
      expect(runs).toBe(1);

      yield* mounted.release;
    }),
  );
});

describe("single-valued definitions", () => {
  it.effect("replaces the previous relation instead of joining it", () =>
    Effect.gen(function* () {
      const Opacity = Token<number>("Opacity").single();
      const Button = Token("Button")();
      const runtime = yield* new Whuiy().make();
      const mounted = yield* runtime.mount(Button(Opacity(0.5), Opacity(0.9)));
      const button = mounted.roots[0]!;

      expect(button.tokens().map(token => token.definition.name)).toEqual(["Opacity"]);
      expect(button.get(Opacity).value()).toBe(0.9);

      yield* button.pipe(Token.add(Opacity(0.25)));
      expect(button.tokens()).toHaveLength(1);
      expect(button.get(Opacity).value()).toBe(0.25);

      yield* mounted.release;
    }),
  );

  it.effect("keeps composing a single-valued definition in a plain description", () =>
    Effect.gen(function* () {
      const Opacity = Token<number>("Opacity").single();
      const Button = Token("Button")();
      const composed = Button(Opacity(0.5), Opacity(0.9));

      expect(composed.tokens().map(token => token.value())).toEqual([0.9]);
    }),
  );
});

describe("list rendering", () => {
  it.effect("projects every sibling token, not just the last one", () =>
    Effect.gen(function* () {
      const Text = Token("Text")<string>();
      const Row = Token("Row")();
      const List = Token("List")();
      const runtime = yield* new Whuiy().make();
      const mounted = yield* runtime.mount(
        List(
          Row(Element.Span(Text("a"))),
          Row(Element.Span(Text("b"))),
          Row(Element.Span(Text("c"))),
        ),
      );
      const list: LiveToken = mounted.roots[0]!;

      expect(list.all(Row)).toHaveLength(3);
      expect(
        list
          .all(Row)
          .flatMap(row => row.all(Element.Span))
          .map(span => span.get(Text).value()),
      ).toEqual(["a", "b", "c"]);

      yield* mounted.release;
    }),
  );
});
