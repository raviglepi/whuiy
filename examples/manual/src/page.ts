import {define} from "@whuiy/codegen";
import {Element, Event, Style, Token} from "whuiy";
import {
  filterRows,
  handleDouble,
  handleIncrement,
  handleQuery,
  handleTheme,
  hasMatches,
  labelText,
  themeBackground,
  themeForeground,
} from "./handlers.ts";

const Count = Token("Count")<number>();
const Query = Token("Query")<string>();
const Theme = Token("Theme")<string>();
const Label = Token("Label").content<string>();
const Text = Token("Text").content<string>();
const Increment = Token("Increment")();
const Double = Token("Double")();
const ToggleTheme = Token("ToggleTheme")();
const Row = Token("Row")();
const Rows = Token("Rows")();

const button = (text: string) => Element.Button(Text(text), Style.Padding("0.5rem 1rem"));

const Search = Element.Input(
  Style.Padding("0.375rem 0.5rem"),
  Style.BorderRadius("0.5rem"),
  Style.Border("1px solid rgb(0 0 0 / 15%)"),
  Style.FontSize("0.9rem"),
  Style.BoxSizing("border-box"),
  Style.Width("100%"),
);

const Results = Element.Ul(
  Rows(Row(Element.Li(Text("row 000"), Style.Padding("0.125rem 0")))),
  Style.Margin("0"),
  Style.Padding("0"),
  Style.ListStyle("none"),
  Style.Display("grid"),
  Style.Gap("0.125rem"),
);

const Section = Element.Section(
  Style.Display("grid"),
  Style.Gap("0.75rem"),
  Style.MaxWidth("28rem"),
  Style.Margin("4rem auto"),
  Style.Padding("1.5rem"),
  Style.BorderRadius("0.75rem"),
  Style.Border("1px solid rgb(0 0 0 / 12%)"),
  Style.FontFamily("ui-sans-serif, system-ui, sans-serif"),
  Style.FontSize("0.95rem"),

  Element.H1(Text("Whuiy counter"), Style.FontSize("1rem"), Style.Margin("0")),
  Element.P(
    Label("0"),
    Style.FontSize("3rem"),
    Style.FontVariantNumeric("tabular-nums"),
    Style.Margin("0"),
  ),
  Element.Div(
    Increment(button("+ 1")),
    Double(button("double")),
    ToggleTheme(button("toggle theme")),
    Style.Display("flex"),
    Style.Gap("0.5rem"),
  ),
  Search,
  Results,
);

/** @since 0.4.0 */
export const description = Section;

/** @since 0.4.0 */
export const program = define(
  {description, runtime: "./handlers.ts", state: [Count(0), Query(""), Theme("light")] as const},
  rules => [
    rules.on(Increment, Event.OnClick, handleIncrement),
    rules.on(Double, Event.OnClick, handleDouble),
    rules.on(ToggleTheme, Event.OnClick, handleTheme),
    rules.on(Search, Event.OnInput, handleQuery),
    rules.derive(Label, [Count], labelText),
    rules.list(Rows, [Query], filterRows),
    rules.show(Results, [Query], hasMatches),
    rules.style(Section, Style.BackgroundColor, [Theme], themeBackground),
    rules.style(Section, Style.Color, [Theme], themeForeground),
  ],
);
