import {describe, expect, it} from "vitest";

import {Effect} from "effect";

import {description, ui} from "../../../examples/playground/src/app.ts";
import {createDomRenderer} from "../src/index.ts";

function mountPlayground(): HTMLElement {
  const parent = document.createElement("main");
  const runtime = Effect.runSync(ui.make());
  const renderer = createDomRenderer({reportError: () => undefined, runtime});
  renderer.render(parent, description);
  return parent;
}

function buttonWithText(parent: HTMLElement, text: string): HTMLButtonElement {
  const button = [...parent.querySelectorAll("button")].find(
    element => element.textContent === text,
  );
  if (button === undefined) throw new Error(`Expected the ${text} button`);
  return button;
}

function press(parent: HTMLElement, text: string): void {
  buttonWithText(parent, text).dispatchEvent(new MouseEvent("click", {bubbles: true}));
}

function label(parent: HTMLElement): string {
  return parent.querySelector("p")?.textContent ?? "";
}

describe("playground app", () => {
  it("counts up, down, and resets from its buttons", () => {
    const parent = mountPlayground();
    expect(label(parent)).toBe("0");

    press(parent, "+ 1");
    press(parent, "+ 1");
    expect(label(parent)).toBe("2");

    press(parent, "- 1");
    expect(label(parent)).toBe("1");

    press(parent, "reset");
    expect(label(parent)).toBe("0");
  });

  it("flips the theme on the section", () => {
    const parent = mountPlayground();
    const section = parent.querySelector("section");
    if (section === null) throw new Error("Expected the section");
    const light = section.style.backgroundColor;

    press(parent, "toggle theme");

    expect(section.style.backgroundColor).not.toBe(light);
  });

  it("does not warn about reads outside rule conditions", () => {
    const parent = document.createElement("main");
    const runtime = Effect.runSync(ui.make());
    const warnings: string[] = [];
    const renderer = createDomRenderer({
      reportError: report => {
        if (report.kind === "warning") warnings.push(report.warning.rule);
      },
      runtime,
    });
    renderer.render(parent, description);

    expect(warnings).toEqual([]);
  });

  it("filters the row list from the search input", () => {
    const parent = mountPlayground();
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
