import {describe, expect, it} from "vitest";

import {mount} from "../../../examples/manual/src/generated.ts";

function incrementButton(parent: HTMLElement): HTMLButtonElement {
  const button = parent.querySelector("button");
  if (button === null) throw new Error("Expected the increment button");
  return button;
}

function searchInput(parent: HTMLElement): HTMLInputElement {
  const input = parent.querySelector("input");
  if (input === null) throw new Error("Expected the search input");
  return input;
}

function sectionOf(parent: HTMLElement): HTMLElement {
  const section = parent.querySelector("section");
  if (section === null) throw new Error("Expected the section");
  return section;
}

function listOf(parent: HTMLElement): HTMLElement {
  const list = parent.querySelector("ul");
  if (list === null) throw new Error("Expected the list");
  return list;
}

function themeButton(parent: HTMLElement): HTMLButtonElement {
  const button = parent.querySelectorAll("button")[1];
  if (button === undefined) throw new Error("Expected the theme button");
  return button;
}

describe("compiled manual app", () => {
  it("runs the counter from a plain click listener", () => {
    const parent = document.createElement("main");
    const dispose = mount(parent);

    expect(parent.querySelector("p")?.textContent).toBe("0");

    const button = incrementButton(parent);
    button.dispatchEvent(new MouseEvent("click", {bubbles: true}));
    button.dispatchEvent(new MouseEvent("click", {bubbles: true}));
    expect(parent.querySelector("p")?.textContent).toBe("2");

    dispose();
    expect(parent.childElementCount).toBe(0);
  });

  it("filters the list from a plain input listener", () => {
    const parent = document.createElement("main");
    mount(parent);

    expect(parent.querySelectorAll("li")).toHaveLength(50);

    const input = searchInput(parent);
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
  });

  it("mounts twice without sharing state", () => {
    const first = document.createElement("main");
    const second = document.createElement("main");
    mount(first);
    mount(second);

    incrementButton(first).dispatchEvent(new MouseEvent("click", {bubbles: true}));

    expect(first.querySelector("p")?.textContent).toBe("1");
    expect(second.querySelector("p")?.textContent).toBe("0");
  });

  it("toggles theme styles and hides an empty result list", () => {
    const parent = document.createElement("main");
    mount(parent);

    const section = sectionOf(parent);
    const list = listOf(parent);
    const light = section.style.backgroundColor;
    expect(light).not.toBe("");
    expect(list.hidden).toBe(false);

    themeButton(parent).dispatchEvent(new MouseEvent("click", {bubbles: true}));
    expect(section.style.backgroundColor).not.toBe(light);

    const input = searchInput(parent);
    input.value = "zzz";
    input.dispatchEvent(new InputEvent("input", {bubbles: true}));
    expect(list.hidden).toBe(true);
  });
});
