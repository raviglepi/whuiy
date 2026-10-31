import type {Program, Setters} from "../src/index.ts";
import {describe, expect, it} from "vitest";

import {Effect} from "effect";

import {Element, Event, Property, Style, Token} from "whuiy";
import {compile, define} from "../src/index.ts";

interface TestState {
  readonly count: number;
}

const Count = Token("Count")<number>();
const Query = Token("Query")<string>();
const Label = Token("Label").content<string>();
const Text = Token("Text").content<string>();
const Increment = Token("Increment")();
const Row = Token("Row")();
const Rows = Token("Rows")();

const handleClick = (setters: Setters<TestState>) =>
  Effect.sync(() => setters.count.update(current => current + 1));

const labelText = (state: {readonly count: number}): string => String(state.count);

const rowsOf = (state: {readonly query: string}): readonly string[] => [state.query];

function counterProgram() {
  return define(
    {
      description: Element.Div(
        Increment(Element.Button(Text("+ 1"))),
        Element.P(Label("0")),
        Element.Ul(Rows(Row(Element.Li(Text("row"))))),
      ),
      runtime: "./handlers.ts",
      state: [Count(0), Query("")] as const,
    },
    rules => [
      rules.on(Increment, Event.OnClick, handleClick),
      rules.derive(Label, [Count], labelText),
      rules.list(Rows, [Query], rowsOf),
    ],
  );
}

describe("codegen", () => {
  it("lowers declarative rules to direct DOM code with no engine", () => {
    const source = compile(counterProgram(), {source: "page.ts"});

    expect(source).toContain('document.createElement("button")');
    expect(source).toContain('button.addEventListener("click"');
    expect(source).toContain("Effect.runFork(handleClick(setters))");
    expect(source).toContain("label.data = String(labelText({count}))");
    expect(source).toContain("ul.replaceChildren(...rowsOf({query}).map(createRow))");
    expect(source).toContain("count = updater(count);");
    expect(source).not.toContain('from "whuiy"');
    expect(source).not.toContain("new Whuiy");
  });

  it("only calls derived updates from the cells they read", () => {
    const source = compile(counterProgram());
    const setters = source.slice(source.indexOf("const setters"));
    const queryBlock = setters.slice(setters.indexOf("query: {"), setters.indexOf("};"));

    expect(queryBlock).toContain("updateRows();");
    expect(queryBlock).not.toContain("updateLabel();");
  });

  it("lowers visibility and style rules to direct property writes", () => {
    const Theme = Token("Theme")<string>();
    const Shell = Element.Div(Element.P(Label("0")));
    const background = (state: {readonly theme: string}): string => state.theme;
    const visible = (state: {readonly theme: string}): boolean => state.theme !== "dark";
    const program = define(
      {description: Shell, runtime: "./handlers.ts", state: [Theme("light")] as const},
      rules => [
        rules.show(Shell, [Theme], visible),
        rules.style(Shell, Style.BackgroundColor, [Theme], background),
      ],
    );

    const source = compile(program);

    expect(source).toContain("div.hidden = !visible({theme});");
    expect(source).toContain("div.style.backgroundColor = String(background({theme}));");
    expect(source).toContain("theme = updater(theme);");
    expect(source).toContain("updateDivVisible();");
    expect(source).toContain("updateDivBackgroundColor();");
  });

  it("lowers property tokens to direct property writes", () => {
    const program = define(
      {
        description: Element.Input(
          Property.Type("checkbox"),
          Property.Checked(true),
          Property.Placeholder("done?"),
        ),
        runtime: "./handlers.ts",
        state: [] as const,
      },
      () => [],
    );

    const source = compile(program);

    expect(source).toContain('input.type = "checkbox";');
    expect(source).toContain("input.checked = true;");
    expect(source).toContain('input.placeholder = "done?";');
  });

  it("rejects a description that carries a static event token", () => {
    const program = define(
      {
        description: Element.Button(Event.OnClick(() => Effect.void)),
        runtime: "./handlers.ts",
        state: [Count(0)] as const,
      },
      () => [],
    );

    expect(() => compile(program)).toThrow(/described statically/);
  });

  it("rejects an ambiguous target", () => {
    const program = define(
      {
        description: Element.Div(Element.P(Label("a")), Element.P(Label("b"))),
        runtime: "./handlers.ts",
        state: [Count(0)] as const,
      },
      rules => [rules.derive(Label, [Count], labelText)],
    );

    expect(() => compile(program)).toThrow(/2 description nodes match Label/);
  });

  it("rejects a dependency that is not a declared state cell", () => {
    const Missing = Token("Missing")<number>();
    const program: Program = {
      description: Element.P(Label("a")),
      rules: [{deps: [Missing], kind: "derive", mapperName: "labelText", target: Label}],
      runtime: "./handlers.ts",
      state: [Count(0)],
    };

    expect(() => compile(program)).toThrow(/not a declared state cell/);
  });

  it("rejects an anonymous handler", () => {
    expect(() =>
      define(
        {
          description: Element.Div(Increment(Element.Button())),
          runtime: "./handlers.ts",
          state: [Count(0)] as const,
        },
        rules => [
          rules.on(Increment, Event.OnClick, (setters: Setters<TestState>) =>
            Effect.sync(() => setters.count.update(c => c)),
          ),
        ],
      ),
    ).toThrow(/Pass a named handler/);
  });

  it("rejects a list target that shares its element", () => {
    const program = define(
      {
        description: Element.Ul(
          Rows(Row(Element.Li(Text("row")))),
          Element.Div(Element.Li(Text("other"))),
        ),
        runtime: "./handlers.ts",
        state: [Count(0), Query("")] as const,
      },
      rules => [rules.list(Rows, [Query], rowsOf)],
    );

    expect(() => compile(program)).toThrow(/shares its element|needs exactly one template child/);
  });
});
