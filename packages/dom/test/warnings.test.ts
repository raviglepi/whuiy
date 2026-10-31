import type {RuleWarning} from "whuiy";
import {describe, expect, it} from "vitest";

import {Effect} from "effect";

import {Token, Whuiy, Element} from "whuiy";
import {createDomRenderer} from "../src/index.ts";

describe("rule read warnings", () => {
  it("reports an out-of-condition read through the error reporter", () => {
    const Panel = Token("Panel")();
    const Count = Token("Count")<number>();
    const Label = Token("Label").content<string>();
    const CountText = Element.P(Label(""));
    const ui = new Whuiy().rule(Panel(), function* (panel) {
      yield* panel
        .get(Element.P)
        .get(Label)
        .pipe(Token.setValue(String(panel.get(Count).value() ?? 0)));
    });
    const runtime = Effect.runSync(ui.make());
    const parent = document.createElement("main");
    const warnings: RuleWarning[] = [];
    const renderer = createDomRenderer({
      reportError: report => {
        if (report.kind === "warning") warnings.push(report.warning);
      },
      runtime,
    });

    renderer.render(parent, Panel(Count(0), CountText));

    expect(warnings.map(warning => warning.rule)).toEqual(["Panel.1"]);
    expect(warnings[0]?.definition.name).toBe("Count");
  });
});
