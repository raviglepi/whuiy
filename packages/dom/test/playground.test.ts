import {describe, expect, it} from "vitest";

import {Effect} from "effect";

import {description, ui} from "../../../examples/playground/src/app.ts";
import {createDomRenderer} from "../src/index.ts";

describe("playground app", () => {
  it("filters the row list from the search input", () => {
    const parent = document.createElement("main");
    const runtime = Effect.runSync(ui.make());
    const failures: string[] = [];
    const renderer = createDomRenderer({
      reportError: error => {
        failures.push(error.kind === "rule" ? `rule ${error.failure.rule}` : "projection");
      },
      runtime,
    });
    renderer.render(parent, description);

    expect(failures).toEqual([]);
    expect(parent.querySelectorAll("li")).toHaveLength(50);

    const input = parent.querySelector("input");
    if (input === null) throw new Error("Expected the search input");
    input.value = "row 12";
    input.dispatchEvent(new InputEvent("input", {bubbles: true}));

    expect([...parent.querySelectorAll("li")].map(item => item.textContent)).toEqual([
      "row 120",
      "row 121",
      "row 122",
      "row 123",
      "row 124",
      "row 125",
      "row 126",
      "row 127",
      "row 128",
      "row 129",
    ]);
    expect(parent.textContent).toContain("10 of 500 rows");

    input.value = "";
    input.dispatchEvent(new InputEvent("input", {bubbles: true}));
    expect(parent.querySelectorAll("li")).toHaveLength(50);
  });
});
