/** @since 0.4.0 */

import {Element, Event, Property, Style, Token, Whuiy} from "whuiy";
import {sans, tone} from "./design.ts";
import {either} from "./facts.ts";
import {gallery} from "./gallery.ts";
import {tipRules} from "./tips.ts";
import {Body, Craft, Gallery, Text, Theme, ThemeSwitch, Top} from "./tokens.ts";
import {button} from "./ui.ts";

const header = () =>
  Element.Header(
    Style.Position("sticky"),
    Style.Top("0"),
    Style.ZIndex("10"),
    Style.Display("flex"),
    Style.AlignItems("center"),
    Style.JustifyContent("space-between"),
    Style.Padding("0 22px"),
    Style.Height("52px"),
    Style.BackgroundColor(tone.background),
    Style.BorderBottom("1px solid " + tone.hairline),
    Element.Span(
      Text("Craft, as rules"),
      Style.FontFamily(sans),
      Style.FontSize("13px"),
      Style.FontWeight("600"),
      Style.LetterSpacing("-0.01em"),
      Style.Color(tone.ink),
    ),
    ThemeSwitch(
      Element.Button(
        Property.Type("button"),
        Text("Theme"),
        ...button(),
        Style.Padding("5px 9px"),
        Style.FontSize("11px"),
      ),
    ),
  );

/** @since 0.4.0 */
export const description = Craft(
  Theme(prefersDark() ? "dark" : "light"),
  Body(
    Element.Div(
      Style.MinHeight("100dvh"),
      Style.BackgroundColor(tone.background),
      Style.Color(tone.ink),
      Style.FontFamily(sans),
      Style.FontSize("13.5px"),
      Style.ColorScheme(either(prefersDark(), "dark", "light")),
      Top(header()),
      Gallery(gallery()),
    ),
  ),
);

/** @since 0.4.0 */
export const ui = tipRules(new Whuiy())
  // The palette is one fact on the canvas.
  .rule(Craft(Theme()), function* (craft) {
    const dark = craft.get(Theme).value() === "dark";
    yield* craft
      .get(Body)
      .get(Element.Div)
      .get(Style.ColorScheme)
      .pipe(Token.setValue(either(dark, "dark", "light")));
  })
  // The switch is wiring: it writes the fact the rule above reads.
  .rule(Craft(), function* (craft) {
    const theme = craft.get(Theme);
    yield* craft
      .get(Body)
      .get(Element.Div)
      .get(Top)
      .get(Element.Header)
      .get(ThemeSwitch)
      .get(Element.Button)
      .pipe(
        Token.add(
          Event.OnClick(() =>
            theme.pipe(Token.setValue(either(theme.value() === "dark", "light", "dark"))),
          ),
        ),
      );
  });

function prefersDark(): boolean {
  return globalThis.matchMedia("(prefers-color-scheme: dark)").matches;
}
