import type {Todo} from "../../../examples/todo/src/app.ts";
import {describe, expect, it} from "vitest";

import {Effect} from "effect";

import {description, ui} from "../../../examples/todo/src/app.ts";
import {createDomRenderer} from "../src/index.ts";

function mountTodos(todos: readonly Todo[]): HTMLElement {
  const parent = document.createElement("main");
  const runtime = Effect.runSync(ui.make());
  const renderer = createDomRenderer({reportError: () => undefined, runtime});
  renderer.render(parent, description(todos));
  return parent;
}

function checkboxes(parent: HTMLElement): readonly HTMLInputElement[] {
  return [...parent.querySelectorAll("li input")].filter(
    (element): element is HTMLInputElement => element instanceof HTMLInputElement,
  );
}

function field(parent: HTMLElement): HTMLInputElement {
  const input = parent.querySelector("section > div > input");
  if (!(input instanceof HTMLInputElement)) throw new Error("Expected the draft input");
  return input;
}

function addButton(parent: HTMLElement): HTMLButtonElement {
  const button = parent.querySelector("section > div > button");
  if (!(button instanceof HTMLButtonElement)) throw new Error("Expected the add button");
  return button;
}

function countText(parent: HTMLElement): string {
  return parent.querySelector("p")?.textContent ?? "";
}

describe("todo example", () => {
  it("renders seeded todos with their count and done styling", () => {
    const parent = mountTodos([
      {done: true, id: 1, title: "first"},
      {done: false, id: 2, title: "second"},
    ]);

    expect([...parent.querySelectorAll("li")].map(row => row.textContent)).toEqual([
      "first×",
      "second×",
    ]);
    expect(countText(parent)).toBe("1 of 2 done");
    expect(checkboxes(parent).map(box => box.checked)).toEqual([true, false]);
    expect(parent.querySelector("li")?.style.textDecoration).toBe("line-through");
  });

  it("toggles a todo from its checkbox", () => {
    const parent = mountTodos([
      {done: true, id: 1, title: "first"},
      {done: false, id: 2, title: "second"},
    ]);

    checkboxes(parent)[1]?.dispatchEvent(new Event("change", {bubbles: true}));

    expect(countText(parent)).toBe("2 of 2 done");
    expect(checkboxes(parent).map(box => box.checked)).toEqual([true, true]);
    expect(parent.querySelectorAll("li")[1]?.style.textDecoration).toBe("line-through");
  });

  it("adds a typed todo and clears the field", () => {
    const parent = mountTodos([]);
    expect(countText(parent)).toBe("nothing yet");

    const input = field(parent);
    input.value = "ship it";
    input.dispatchEvent(new InputEvent("input", {bubbles: true}));
    addButton(parent).dispatchEvent(new MouseEvent("click", {bubbles: true}));

    expect([...parent.querySelectorAll("li")].map(row => row.textContent)).toEqual(["ship it×"]);
    expect(countText(parent)).toBe("0 of 1 done");
    expect(field(parent).value).toBe("");

    parent.querySelector("li button")?.dispatchEvent(new MouseEvent("click", {bubbles: true}));
    expect(parent.querySelectorAll("li")).toHaveLength(0);
    expect(countText(parent)).toBe("nothing yet");
  });

  it("ignores an empty draft", () => {
    const parent = mountTodos([]);

    addButton(parent).dispatchEvent(new MouseEvent("click", {bubbles: true}));

    expect(parent.querySelectorAll("li")).toHaveLength(0);
    expect(countText(parent)).toBe("nothing yet");
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
    renderer.render(parent, description([]));

    expect(warnings).toEqual([]);
  });
});
