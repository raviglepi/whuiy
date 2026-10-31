/** @since 0.4.0 */

import type {TokenInstanceRef} from "whuiy";

import {Match} from "effect";

import {Element, Property, Style} from "whuiy";
import {lift, mono, radius, sans, tone} from "./design.ts";
import {
  Chip,
  Control,
  Controls,
  Hovered,
  InnerPadding,
  NestedDemo,
  NestedReadout,
  Numbers,
  NumericDemo,
  OuterInput,
  OuterRadius,
  Outlined,
  OutlineChoice,
  OutlineDemo,
  OutlineReadout,
  OutlineStrength,
  OutlineStrengthInput,
  PaddingInput,
  Photos,
  Pressed,
  ProportionalColumn,
  ProportionalValue,
  ReadoutRow,
  Reading,
  RevealDemo,
  Revealed,
  Selected,
  Stage,
  TabularColumn,
  TabularValue,
  Text,
} from "./tokens.ts";
import {hoverable} from "./ui.ts";

/** The frame every demo sits in: a card, not a screenshot. */
const frame = () =>
  [
    Style.BackgroundColor(tone.card),
    Style.Border("1px solid " + tone.hairline),
    Style.BorderRadius(radius.demo),
    Style.Padding("16px"),
    Style.Display("grid"),
    Style.Gap("14px"),
    Style.Margin("22px 0 24px"),
    Style.BoxShadow(lift),
  ] as const;

const controlRow = () =>
  [
    Style.Display("flex"),
    Style.AlignItems("center"),
    Style.JustifyContent("center"),
    Style.Gap("6px"),
    Style.FlexWrap("wrap"),
  ] as const;

/** A chip is a button that knows whether it is the chosen option. */
const chipBase = () =>
  [
    Style.Appearance("none"),
    Style.BackgroundColor("transparent"),
    Style.Border("1px solid transparent"),
    Style.BorderColor("transparent"),
    Style.BoxShadow("none"),
    Style.Transform("none"),
    Style.Opacity("1"),
    Style.BorderRadius("6px"),
    Style.Padding("5px 9px"),
    Style.FontFamily(sans),
    Style.FontSize("11.5px"),
    Style.LineHeight("1"),
    Style.Color(tone.muted),
    Style.Cursor("pointer"),
    Style.Transition("background-color 140ms ease, color 140ms ease, opacity 140ms ease"),
  ] as const;

const label = () =>
  [Style.FontFamily(sans), Style.FontSize("11.5px"), Style.Color(tone.muted)] as const;

const slider = () =>
  [
    Style.Appearance("auto"),
    Style.Width("104px"),
    Style.AccentColor(tone.ink),
    Style.Cursor("pointer"),
  ] as const;

const photoFrames = () =>
  [Style.Display("grid"), Style.GridTemplateColumns("repeat(3, 1fr)"), Style.Gap("10px")] as const;

const photoStyle = () =>
  [
    Style.Display("block"),
    Style.Width("100%"),
    Style.AspectRatio("4 / 3"),
    Style.ObjectFit("cover"),
    Style.BorderRadius("8px"),
    Style.Outline("none"),
    Style.OutlineOffset("-1px"),
    Style.Color(tone.ink),
  ] as const;

const photo = (file: string) =>
  Element.Img(Property.Src("/photos/" + file), Property.Alt(""), ...photoStyle());

const chip = (caption: string, choice: string, selected: boolean) =>
  Chip(
    Selected(selected),
    OutlineChoice(choice),
    Element.Button(Property.Type("button"), Text(caption), ...chipBase()),
  );

/** Image outlines: a line, drawn just inside the image. */
export const outlineDemo = () =>
  OutlineDemo(
    Outlined(true),
    OutlineStrength(10),
    Element.Section(
      ...frame(),
      Photos(
        Element.Div(
          ...photoFrames(),
          photo("beach.webp"),
          photo("cliff.webp"),
          photo("clouds.webp"),
        ),
      ),
      Controls(
        Element.Div(...controlRow(), chip("No outline", "off", false), chip("Outline", "on", true)),
      ),
      ReadoutRow(
        Element.Div(
          Style.Display("flex"),
          Style.AlignItems("center"),
          Style.JustifyContent("space-between"),
          Style.Gap("12px"),
          Style.BorderTop("1px solid " + tone.hairline),
          Style.PaddingTop("12px"),
          Element.Span(Text("Outline strength"), ...label()),
          OutlineReadout(
            "10%",
            Style.FontFamily(mono),
            Style.FontSize("11px"),
            Style.Color(tone.ink),
          ),
          OutlineStrengthInput(
            Element.Input(
              Property.Type("range"),
              Property.Min("4"),
              Property.Max("24"),
              Property.Value("10"),
              ...slider(),
            ),
          ),
        ),
      ),
    ),
  );

/** Nested border radius: the inner corner is the outer corner minus the gap. */
export const nestedDemo = () =>
  NestedDemo(
    OuterRadius(28),
    InnerPadding(12),
    Element.Section(
      ...frame(),
      Stage(
        Element.Div(
          Style.BackgroundColor(tone.wash),
          Style.Padding("26px"),
          Style.BorderRadius("16px"),
          Style.Display("grid"),
          Style.PlaceItems("center"),
          Style.Transition("padding 160ms ease, border-radius 160ms ease"),
          Element.Div(
            Style.BackgroundColor(tone.card),
            Style.Border("1px solid " + tone.hairline),
            Style.Height("92px"),
            Style.Width("100%"),
            Style.BorderRadius("10px"),
            Style.Transition("border-radius 160ms ease"),
          ),
        ),
      ),
      Controls(
        Element.Div(
          ...controlRow(),
          Element.Span(Text("Radius"), ...label()),
          OuterInput(
            Element.Input(
              Property.Type("range"),
              Property.Min("8"),
              Property.Max("44"),
              Property.Value("28"),
              ...slider(),
            ),
          ),
          Element.Span(Text("Padding"), ...label()),
          PaddingInput(
            Element.Input(
              Property.Type("range"),
              Property.Min("0"),
              Property.Max("28"),
              Property.Value("12"),
              ...slider(),
            ),
          ),
        ),
      ),
      ReadoutRow(
        Element.Div(
          NestedReadout(
            "28 − 12 = 16px inner",
            Style.FontFamily(mono),
            Style.FontSize("11px"),
            Style.Color(tone.muted),
            Style.TextAlign("center"),
          ),
        ),
      ),
    ),
  );

const numericColumn = <Value extends TokenInstanceRef>(
  caption: string,
  tabular: boolean,
  value: Value,
) =>
  Element.Div(
    Style.Display("grid"),
    Style.JustifyItems("end"),
    Style.Gap("6px"),
    Style.Padding("10px 14px"),
    Style.BorderRight("1px dashed " + tone.strong),
    Element.P(Text(caption), ...label(), Style.Margin("0")),
    Element.Span(
      value,
      Style.FontFamily(sans),
      Style.FontSize("26px"),
      Style.LetterSpacing("-0.02em"),
      Style.Color(tone.ink),
      Style.FontVariantNumeric(tabular ? "tabular-nums" : "proportional-nums"),
    ),
  );

/** Tabular numbers: two kinds of digit widths, side by side. */
export const numericDemo = () =>
  NumericDemo(
    Reading(1111),
    Element.Section(
      ...frame(),
      Numbers(
        Element.Div(
          Style.Display("grid"),
          Style.GridTemplateColumns("1fr 1fr"),
          Style.JustifyContent("center"),
          ProportionalColumn(numericColumn("Proportional", false, ProportionalValue("1,111"))),
          TabularColumn(numericColumn("Tabular", true, TabularValue("1,111"))),
        ),
      ),
      Controls(
        Element.Div(
          ...controlRow(),
          Control(
            Hovered(false),
            Pressed(false),
            Element.Button(Property.Type("button"), Text("Advance"), ...hoverable(), ...chipBase()),
          ),
        ),
      ),
    ),
  );

const pressBase = () =>
  [
    Style.Appearance("none"),
    Style.BoxShadow("none"),
    Style.Transform("none"),
    Style.FontFamily(sans),
    Style.FontSize("12.5px"),
    Style.BorderRadius("8px"),
    Style.Cursor("pointer"),
    Style.Transition("transform 160ms cubic-bezier(0.32, 0.72, 0, 1), background-color 160ms ease"),
  ] as const;

const pressFilled = (caption: string) =>
  Control(
    Hovered(false),
    Pressed(false),
    Element.Button(
      Property.Type("button"),
      Text(caption),
      ...pressBase(),
      Style.Padding("8px 14px"),
      ...hoverable(),
      Style.Border("1px solid transparent"),
      Style.BackgroundColor(tone.ink),
      Style.Color(tone.background),
    ),
  );

const pressQuiet = (caption: string) =>
  Control(
    Hovered(false),
    Pressed(false),
    Element.Button(
      Property.Type("button"),
      Text(caption),
      ...pressBase(),
      Style.Padding("8px 12px"),
      ...hoverable(),
      Style.Border("1px solid " + tone.hairline),
      Style.BackgroundColor("transparent"),
      Style.Color(tone.muted),
    ),
  );

/** Button press: the same 0.97 scale on every shape. */
export const pressDemo = () =>
  Element.Div(
    ...frame(),
    Element.Div(
      Style.Display("flex"),
      Style.JustifyContent("center"),
      Style.Gap("8px"),
      pressFilled("Continue"),
      pressQuiet("Cancel"),
    ),
  );

const grain =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E\")";

/** Noise: grain over a gradient, to hide the banding. */
export const noiseDemo = () =>
  Element.Div(
    ...frame(),
    Element.Div(
      Style.Height("128px"),
      Style.BorderRadius("10px"),
      Style.Position("relative"),
      Style.Overflow("hidden"),
      Style.BackgroundImage("linear-gradient(120deg, #b9c6ff, #f4e3d7 45%, #ffd1a8)"),
      Element.Div(
        Style.Position("absolute"),
        Style.Inset("0"),
        Style.BackgroundImage(grain),
        Style.Opacity("0.28"),
        Style.MixBlendMode("multiply"),
        Style.BackgroundSize("140px 140px"),
      ),
    ),
  );

const fadeRow = (caption: string, value: string) =>
  Element.Div(
    Element.Span(Text(caption), Style.Color(tone.ink), Style.FontSize("12.5px")),
    Element.Span(
      Text(value),
      Style.FontFamily(mono),
      Style.FontSize("11px"),
      Style.Color(tone.muted),
    ),
    Style.Display("flex"),
    Style.JustifyContent("space-between"),
    Style.Padding("7px 10px"),
    Style.BorderBottom("1px solid " + tone.hairline),
  );

/** Scroll fades: fade only the edge that has more to scroll. */
export const scrollDemo = () =>
  Element.Div(
    ...frame(),
    Element.Div(
      Style.MaxHeight("132px"),
      Style.OverflowY("auto"),
      Style.Border("1px solid " + tone.hairline),
      Style.BorderRadius("9px"),
      Style.MaskImage("linear-gradient(to bottom, transparent, black 18%, black 86%, transparent)"),
      fadeRow("Tokens, not classes", "0.4 kB"),
      fadeRow("Rules, not props", "1.2 kB"),
      fadeRow("One description", "8.8 kB"),
      fadeRow("No diff", "0 kB"),
      fadeRow("No re-render", "0 kB"),
      fadeRow("Derived text", "2.1 kB"),
    ),
  );

const glyph = (value: string, transform: string) =>
  Element.Span(
    Text(value),
    Style.Width("26px"),
    Style.Height("26px"),
    Style.Display("grid"),
    Style.PlaceItems("center"),
    Style.BorderRadius("50%"),
    Style.BackgroundColor(tone.wash),
    Style.Color(tone.ink),
    Style.FontSize("12px"),
    Style.Transform(transform),
  );

/** Optical alignment: center for the eye, then keep the nudge. */
export const opticalDemo = () =>
  Element.Div(
    ...frame(),
    Element.Div(
      Style.Display("flex"),
      Style.JustifyContent("center"),
      Style.Gap("10px"),
      glyph("▶", "translateX(1px)"),
      glyph("★", "translateY(-1px)"),
      glyph("↓", "translateY(1px)"),
    ),
  );

const smoothingSample = (surface: string, ink: string, caption: string) =>
  Element.Div(
    Style.Display("grid"),
    Style.Gap("6px"),
    Style.Padding("14px 16px"),
    Style.BackgroundColor(surface),
    Style.BorderRadius("9px"),
    Style.Border("1px solid " + tone.hairline),
    Element.Span(
      Text("Light text on dark renders heavier."),
      Style.FontSize("15px"),
      Style.LineHeight("1.4"),
      Style.Color(ink),
    ),
    Element.Span(Text(caption), ...label()),
  );

/** Font smoothing: the property is vendor-only, so the stylesheet keeps it. */
export const smoothingDemo = () =>
  Element.Div(
    ...frame(),
    smoothingSample(tone.background, tone.ink, "Ink on the page"),
    smoothingSample("#171717", "#ededed", "Ink on a dark card"),
  );

/** HTML background: the canvas behind the page. */
export const canvasDemo = () =>
  Element.Div(
    ...frame(),
    Element.Div(
      Style.Display("grid"),
      Style.GridTemplateColumns("1fr 1fr"),
      Style.Gap("10px"),
      Element.Div(
        Style.Display("grid"),
        Style.PlaceItems("center"),
        Style.Height("84px"),
        Style.BackgroundColor(tone.background),
        Style.BorderRadius("9px"),
        Style.Border("1px solid " + tone.hairline),
        Element.Span(Text("body"), ...label()),
        Element.Div(
          Style.Width("52px"),
          Style.Height("30px"),
          Style.BackgroundColor(tone.card),
          Style.BorderRadius("6px"),
          Style.Border("1px solid " + tone.hairline),
        ),
      ),
      Element.Div(
        Style.Display("grid"),
        Style.PlaceItems("center"),
        Style.Height("84px"),
        Style.BackgroundColor(tone.wash),
        Style.BorderRadius("9px"),
        Element.Span(Text("html"), ...label()),
        Element.Div(
          Style.Width("52px"),
          Style.Height("30px"),
          Style.BackgroundColor(tone.background),
          Style.BorderRadius("6px"),
          Style.Border("1px solid " + tone.hairline),
        ),
      ),
    ),
  );

const restraintCard = (title: string, note: string) =>
  Control(
    Hovered(false),
    Pressed(false),
    Element.Button(
      Property.Type("button"),
      ...hoverable(),
      Style.BoxShadow("none"),
      Style.Transform("none"),
      Style.Display("grid"),
      Style.Gap("4px"),
      Style.TextAlign("left"),
      Style.Padding("10px 12px"),
      Style.BorderRadius("9px"),
      Style.Border("1px solid " + tone.hairline),
      Style.BackgroundColor("transparent"),
      Style.Cursor("pointer"),
      Style.Transition("background-color 160ms ease, border-color 160ms ease"),
      Element.Span(
        Text(title),
        Style.FontSize("12px"),
        Style.Color(tone.ink),
        Style.FontFamily(sans),
      ),
      Element.Span(
        Text(note),
        Style.FontSize("11px"),
        Style.Color(tone.faint),
        Style.FontFamily(sans),
      ),
    ),
  );

/** Hover restraint: tint the surface, leave the layout alone. */
export const hoverDemo = () =>
  Element.Div(
    ...frame(),
    Element.Div(
      Style.Display("grid"),
      Style.GridTemplateColumns("repeat(3, 1fr)"),
      Style.Gap("8px"),
      restraintCard("A menu item", "tints"),
      restraintCard("A card", "tints"),
      restraintCard("A row", "tints"),
    ),
  );

/** Interruptibility: a reversal is a new transition from the current value. */
export const revealDemo = () =>
  RevealDemo(
    Revealed(false),
    Element.Section(
      ...frame(),
      Stage(
        Element.Div(
          Style.Display("flex"),
          Style.JustifyContent("center"),
          Style.Padding("6px 0"),
          Element.Div(
            Style.Width("132px"),
            Style.Height("40px"),
            Style.BorderRadius("8px"),
            Style.BackgroundColor(tone.ink),
            Style.Transform("translateX(-64px)"),
            Style.Transition("transform 420ms cubic-bezier(0.32, 0.72, 0, 1)"),
            Element.Div(
              Style.Width("12px"),
              Style.Height("12px"),
              Style.Margin("14px auto"),
              Style.BorderRadius("50%"),
              Style.BackgroundColor(tone.background),
            ),
          ),
        ),
      ),
      Controls(
        Element.Div(
          ...controlRow(),
          Control(
            Hovered(false),
            Pressed(false),
            Element.Button(Property.Type("button"), Text("Move"), ...hoverable(), ...chipBase()),
          ),
        ),
      ),
    ),
  );

/** The demo an essay carries, if the essay has one. */
export const demoFor = (slug: string) =>
  Match.value(slug).pipe(
    Match.when("button-press", pressDemo),
    Match.when("font-smoothing", smoothingDemo),
    Match.when("hover-restraint", hoverDemo),
    Match.when("html-background", canvasDemo),
    Match.when("image-outlines", outlineDemo),
    Match.when("interruptibility", revealDemo),
    Match.when("nested-border-radius", nestedDemo),
    Match.when("noise", noiseDemo),
    Match.when("optical-alignment", opticalDemo),
    Match.when("scroll-fades", scrollDemo),
    Match.when("tabular-numbers", numericDemo),
    Match.orElse(() => Element.Div()),
  );
