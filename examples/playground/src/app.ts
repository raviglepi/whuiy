import type {LiveToken, TokenDefinitionRef} from "whuiy";

import {Element, Event, Style, Token, Whuiy} from "whuiy";

const Count = Token("Count")<number>();
const Theme = Token("Theme")<string>();
const Query = Token("Query")<string>();
const Label = Token("Label").content<string>();
const Results = Token("Results").content<string>();
const Text = Token("Text").content<string>();

const Page = Token("Page")();
const Counter = Token("Counter")();
const CountPanel = Token("CountPanel")();
const StatusLine = Token("StatusLine")();
const Increment = Token("Increment")();
const Decrement = Token("Decrement")();
const Reset = Token("Reset")();
const ToggleTheme = Token("ToggleTheme")();
const Row = Token("Row")();
const Rows = Token("Rows")();

const ITEMS = Array.from({length: 500}, (_, index) => `row ${String(index + 1).padStart(3, "0")}`);
const LIMIT = 50;

const matches = (query: string): readonly string[] =>
  ITEMS.filter(item => item.includes(query)).slice(0, LIMIT);

const nextTheme = (theme: string | undefined): string => (theme === "dark" ? "light" : "dark");

const background = (dark: boolean) => Style.BackgroundColor(dark ? "#12141a" : "#ffffff");
const foreground = (dark: boolean) => Style.Color(dark ? "#e7e9ee" : "#15171c");
const shadow = (dark: boolean) => Style.BoxShadow(dark ? "none" : "0 1px 2px rgb(0 0 0 / 8%)");

const button = (text: string) => Element.Button(Text(text), Style.Padding("0.5rem 1rem"));

const row = (text: string) => Row(Element.Li(Text(text), Style.Padding("0.125rem 0")));

/** @since 0.4.0 */
export const description = Page(
  Counter(
    Theme("light"),
    Query(""),
    Element.Section(
      Style.Display("grid"),
      Style.Gap("0.75rem"),
      Style.MaxWidth("28rem"),
      Style.Margin("4rem auto"),
      Style.Padding("1.5rem"),
      Style.BorderRadius("0.75rem"),
      Style.FontFamily("ui-sans-serif, system-ui, sans-serif"),
      Style.FontSize("0.95rem"),

      Element.H1(Text("Whuiy counter"), Style.FontSize("1rem"), Style.Margin("0")),
      CountPanel(
        Element.P(
          Label("0"),
          Style.FontSize("3rem"),
          Style.FontVariantNumeric("tabular-nums"),
          Style.Margin("0"),
        ),
      ),
      Element.Div(
        Increment(button("+ 1")),
        Decrement(button("- 1")),
        Reset(button("reset")),
        Style.Display("flex"),
        Style.Gap("0.5rem"),
      ),
      Element.Nav(ToggleTheme(button("toggle theme")), Style.Display("flex"), Style.Gap("0.5rem")),
      Element.Input(
        Style.Padding("0.375rem 0.5rem"),
        Style.BorderRadius("0.5rem"),
        Style.Border("1px solid rgb(0 0 0 / 15%)"),
        Style.FontSize("0.9rem"),
        Style.BoxSizing("border-box"),
        Style.Width("100%"),
      ),
      StatusLine(Element.P(Results(""), Style.Margin("0"), Style.Opacity("0.7"))),
      Element.Ul(
        Rows(),
        Style.Margin("0"),
        Style.Padding("0"),
        Style.ListStyle("none"),
        Style.Display("grid"),
        Style.Gap("0.125rem"),
      ),
    ),
    Count(0),
  ),
);

function control(token: LiveToken, kind: TokenDefinitionRef) {
  return token.get(kind).get(Element.Button);
}

/** @since 0.4.0 */
export const ui = new Whuiy()
  .rule(Counter(), function* (counter) {
    const current = () => counter.get(Count).value() ?? 0;
    const count = counter.get(Count);
    const toolbar = counter.get(Element.Section).get(Element.Div);
    const themeBar = counter.get(Element.Section).get(Element.Nav);
    const query = counter.get(Query);
    const input = counter.get(Element.Section).get(Element.Input);
    yield* control(toolbar, Increment).pipe(
      Token.add(Event.OnClick(() => count.pipe(Token.setValue(current() + 1)))),
    );
    yield* control(toolbar, Decrement).pipe(
      Token.add(Event.OnClick(() => count.pipe(Token.setValue(Math.max(0, current() - 1))))),
    );
    yield* control(toolbar, Reset).pipe(
      Token.add(Event.OnClick(() => count.pipe(Token.setValue(0)))),
    );
    yield* control(themeBar, ToggleTheme).pipe(
      Token.add(
        Event.OnClick(() =>
          counter.get(Theme).pipe(Token.setValue(nextTheme(counter.get(Theme).value()))),
        ),
      ),
    );
    yield* input.pipe(
      Token.add(
        Event.OnInput(event => {
          const target = event.target;
          return query.pipe(Token.setValue(target instanceof HTMLInputElement ? target.value : ""));
        }),
      ),
    );
  })
  .rule(Counter(Count()), function* (counter) {
    yield* counter
      .get(Element.Section)
      .get(CountPanel)
      .get(Element.P)
      .get(Label)
      .pipe(Token.setValue(String(counter.get(Count).value() ?? 0)));
  })
  .rule(Counter(Theme()), function* (counter) {
    const section = counter.get(Element.Section);
    const dark = counter.get(Theme).value() === "dark";
    yield* section.pipe(Token.add(background(dark), foreground(dark), shadow(dark)));
  })
  .rule(Counter(Query()), function* (counter) {
    const query = String(counter.get(Query).value() ?? "").toLowerCase();
    const visible = matches(query);
    const box = counter.get(Element.Section).get(Element.Ul).get(Rows);
    const summary = counter.get(Element.Section).get(StatusLine).get(Element.P).get(Results);
    yield* box.pipe(Token.set(...visible.map(row)));
    yield* summary.pipe(Token.setValue(`${visible.length} of ${ITEMS.length} rows`));
  });
