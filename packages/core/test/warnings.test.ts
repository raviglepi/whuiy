import type {RuleWarning, WhuiyRuntime} from "../src/index.ts";
import {describe, expect, it} from "@effect/vitest";

import {Effect} from "effect";

import {Event, Token, Whuiy} from "../src/index.ts";

const start = (
  ui: Whuiy,
): Effect.Effect<{readonly runtime: WhuiyRuntime; readonly warnings: RuleWarning[]}> =>
  Effect.gen(function* () {
    const runtime = yield* ui.make();
    const warnings: RuleWarning[] = [];
    runtime.subscribeWarnings(warning => warnings.push(warning));
    return {runtime, warnings};
  });

describe("rule read warnings", () => {
  it.effect("warns when a rule reads a token outside its condition", () =>
    Effect.gen(function* () {
      const Panel = Token("Panel")();
      const Count = Token("Count")<number>();
      const Label = Token("Label").content<string>();
      const {runtime, warnings} = yield* start(
        new Whuiy().rule(Panel(), function* (panel) {
          yield* panel.get(Label).pipe(Token.setValue(String(panel.get(Count).value() ?? 0)));
        }),
      );

      yield* runtime.mount(Panel(Count(0), Label("")));

      expect(warnings.map(warning => warning.rule)).toEqual(["Panel.1"]);
      expect(warnings[0]?.definition.name).toBe("Count");
      expect(warnings[0]?.message).toContain("will not run again when Count changes");
    }),
  );

  it.effect("stays silent when the condition includes the read token", () =>
    Effect.gen(function* () {
      const Panel = Token("Panel")();
      const Count = Token("Count")<number>();
      const Label = Token("Label").content<string>();
      const {runtime, warnings} = yield* start(
        new Whuiy().rule(Panel(Count()), function* (panel) {
          yield* panel.get(Label).pipe(Token.setValue(String(panel.get(Count).value() ?? 0)));
        }),
      );

      yield* runtime.mount(Panel(Count(0), Label("")));

      expect(warnings).toEqual([]);
    }),
  );

  it.effect("stays silent for reads inside event handlers", () =>
    Effect.gen(function* () {
      const Panel = Token("Panel")();
      const Count = Token("Count")<number>();
      const Button = Token("Button")();
      const {runtime, warnings} = yield* start(
        new Whuiy().rule(Panel(), function* (panel) {
          yield* panel.get(Button).pipe(
            Token.add(
              Event.OnClick(() => {
                panel.get(Count).value();
                return Effect.void;
              }),
            ),
          );
        }),
      );

      const mounted = yield* runtime.mount(Panel(Count(0), Button()));

      expect(warnings).toEqual([]);
      yield* mounted.release;
    }),
  );

  it.effect("warns once per rule and definition", () =>
    Effect.gen(function* () {
      const Panel = Token("Panel")();
      const Count = Token("Count")<number>();
      const Touched = Token("Touched")();
      const {runtime, warnings} = yield* start(
        new Whuiy().rule(Panel(), function* (panel) {
          panel.get(Count).value();
          yield* panel.pipe(Token.add(Touched()));
        }),
      );

      const first = yield* runtime.mount(Panel(Count(0)));
      yield* first.release;
      const second = yield* runtime.mount(Panel(Count(1)));
      yield* second.release;

      expect(warnings).toHaveLength(1);
    }),
  );
});
