import type {LiveToken, TokenDefinitionRef} from "whuiy";

import {Element, Event, Style, Token, Whuiy} from "whuiy";

const Count = Token("Count")<number>();
const Theme = Token("Theme")<string>();
const Label = Token("Label")<string>();
const Text = Token("Text")<string>();

const Page = Token("Page")();
const Counter = Token("Counter")();
const Increment = Token("Increment")();
const Decrement = Token("Decrement")();
const Reset = Token("Reset")();
const ToggleTheme = Token("ToggleTheme")();

const nextTheme = (theme: string | undefined): string => (theme === "dark" ? "light" : "dark");

const background = (dark: boolean) => Style.BackgroundColor(dark ? "#12141a" : "#ffffff");
const foreground = (dark: boolean) => Style.Color(dark ? "#e7e9ee" : "#15171c");
const shadow = (dark: boolean) => Style.BoxShadow(dark ? "none" : "0 1px 2px rgb(0 0 0 / 8%)");

const Toolbar = Element.Div(
  Increment(Element.Button(Text("+ 1"), Style.Padding("0.5rem 1rem"))),
  Decrement(Element.Button(Text("- 1"), Style.Padding("0.5rem 1rem"))),
  Reset(Element.Button(Text("reset"), Style.Padding("0.5rem 1rem"))),
  Style.Display("flex"),
  Style.Gap("0.5rem"),
);

const ThemeBar = Element.Nav(
  ToggleTheme(Element.Button(Text("toggle theme"), Style.Padding("0.5rem 1rem"))),
  Style.Display("flex"),
  Style.Gap("0.5rem"),
);

/** @since 0.4.0 */
export const description = Page(
  Counter(
    Count(0),
    Theme("light"),
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
      Element.P(
        Label("0"),
        Style.FontSize("3rem"),
        Style.FontVariantNumeric("tabular-nums"),
        Style.Margin("0"),
      ),
      Toolbar,
      ThemeBar,
    ),
  ),
);

function button(token: LiveToken, kind: TokenDefinitionRef) {
  return token.get(kind).get(Element.Button);
}

/** @since 0.4.0 */
export const ui = new Whuiy()
  .rule(Counter(), function* (counter) {
    const current = () => counter.get(Count).value() ?? 0;
    const count = counter.get(Count);
    yield* button(counter, Increment).pipe(
      Token.add(Event.OnClick(() => count.pipe(Token.setValue(current() + 1)))),
    );
    yield* button(counter, Decrement).pipe(
      Token.add(Event.OnClick(() => count.pipe(Token.setValue(Math.max(0, current() - 1))))),
    );
    yield* button(counter, Reset).pipe(
      Token.add(Event.OnClick(() => count.pipe(Token.setValue(0)))),
    );
    yield* button(counter, ToggleTheme).pipe(
      Token.add(
        Event.OnClick(() =>
          counter.get(Theme).pipe(Token.setValue(nextTheme(counter.get(Theme).value()))),
        ),
      ),
    );
  })
  .rule(Counter(Count()), function* (counter) {
    yield* counter
      .get(Element.Section)
      .get(Element.P)
      .get(Label)
      .pipe(Token.setValue(String(counter.get(Count).value() ?? 0)));
  })
  .rule(Counter(Theme()), function* (counter) {
    const section = counter.get(Element.Section);
    const dark = counter.get(Theme).value() === "dark";
    yield* section.pipe(Token.add(background(dark), foreground(dark), shadow(dark)));
  });
