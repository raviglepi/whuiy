/** @since 0.4.0 */

import type {TokenInstanceRef} from "whuiy";

import {Element, Property, Style} from "whuiy";
import {mono, radius, sans, tone} from "./design.ts";
import {
  AdvanceStep,
  Balanced,
  Edged,
  Faded,
  Framed,
  Hovered,
  HoverProbe,
  InnerBox,
  Metric,
  MoreAbove,
  MoreBelow,
  Moved,
  Mover,
  NestedBox,
  Optical,
  Outer,
  Padding,
  Pressable,
  Pressed,
  PressProbe,
  Reading,
  ReadingText,
  ScrollProbe,
  Glyph,
  Size,
  Sliding,
  Smooth,
  Steady,
  Step,
  Target,
  Text,
  Tightened,
  Tinted,
} from "./tokens.ts";
import {button, card, display, hairline, iconButton, label, prose, ruleChip} from "./ui.ts";

/** A specimen card with a caption. */
const cell = <Content extends TokenInstanceRef>(caption: string, content: Content) =>
  Element.Div(...card(), Style.Gap("12px"), Element.Span(Text(caption), ...label()), content);

const section = <Plain extends TokenInstanceRef, Crafted extends TokenInstanceRef>(
  index: string,
  name: string,
  principle: string,
  rule: string,
  plain: Plain,
  crafted: Crafted,
  captions: readonly [string, string] = ["plain", "with the rule"],
) =>
  Element.Section(
    Style.Display("grid"),
    Style.Gap("10px"),
    Style.Padding("24px 0"),
    Style.BorderTop("1px solid " + tone.hairline),
    Element.Div(
      Style.Display("flex"),
      Style.AlignItems("center"),
      Style.Gap("10px"),
      Element.Span(
        Text(index),
        Style.FontFamily(mono),
        Style.FontSize("10.5px"),
        Style.Color(tone.faint),
      ),
      Element.Span(
        Text(name),
        Style.FontFamily(sans),
        Style.FontSize("14.5px"),
        Style.FontWeight("600"),
        Style.Color(tone.ink),
      ),
      Element.Div(...hairline()),
      ruleChip(rule),
    ),
    Element.P(Text(principle), ...prose()),
    Element.Div(
      Style.Display("grid"),
      Style.GridTemplateColumns("repeat(auto-fit, minmax(230px, 1fr))"),
      Style.Gap("10px"),
      cell(captions[0], plain),
      cell(captions[1], crafted),
    ),
  );

const glyph = (value: string) =>
  Element.Span(
    Text(value),
    Style.Width("40px"),
    Style.Height("40px"),
    Style.Display("grid"),
    Style.PlaceItems("center"),
    Style.BorderRadius("50%"),
    Style.BackgroundColor(tone.wash),
    Style.Color(tone.ink),
    Style.FontSize("16px"),
    Style.Transform("none"),
  );

const innerCard = (radiusValue: string) =>
  Element.Div(
    Style.BackgroundColor(tone.card),
    Style.Border("1px solid " + tone.hairline),
    Style.Height("88px"),
    Style.Width("100%"),
    Style.BorderRadius(radiusValue),
  );

const outerBox = <Inner extends TokenInstanceRef>(
  padding: string,
  radiusValue: string,
  child: Inner,
) =>
  Element.Div(
    Style.BackgroundColor(tone.wash),
    Style.Padding(padding),
    Style.BorderRadius(radiusValue),
    Style.Display("grid"),
    Style.PlaceItems("center"),
    child,
  );

const metric = (steady: boolean) =>
  Element.Div(
    Style.Display("flex"),
    Style.AlignItems("center"),
    Style.JustifyContent("space-between"),
    Style.Gap("12px"),
    Metric(
      Reading(1111),
      Steady(steady),
      Element.Span(
        ReadingText("1,111"),
        Style.FontFamily(sans),
        Style.FontSize("26px"),
        Style.LetterSpacing("-0.02em"),
        Style.Color(tone.ink),
        Style.FontVariantNumeric("proportional-nums"),
      ),
      AdvanceStep(
        Element.Button(
          Property.Type("button"),
          Text("Advance"),
          ...button(),
          Style.Padding("6px 9px"),
          Style.FontSize("11px"),
        ),
      ),
    ),
  );

const headline = () =>
  Element.H1(
    Text("Continue where you left off"),
    Style.FontFamily(sans),
    Style.FontSize("30px"),
    Style.FontWeight("600"),
    Style.LineHeight("1.15"),
    Style.Color(tone.ink),
    Style.Margin("0"),
    Style.LetterSpacing("0"),
  );

const heading = () =>
  Element.H2(
    Text("Details that make interfaces feel better to use"),
    Style.FontFamily(sans),
    Style.FontSize("18px"),
    Style.FontWeight("600"),
    Style.LineHeight("1.3"),
    Style.Color(tone.ink),
    Style.Margin("0"),
    Style.TextWrap("wrap"),
  );

const wrapFrame = <Title extends TokenInstanceRef>(title: Title) =>
  Element.Div(Style.Width("220px"), title);

const photo = (file: string) =>
  Element.Img(
    Property.Src("/photos/" + file),
    Property.Alt(""),
    Style.Display("block"),
    Style.Width("100%"),
    Style.AspectRatio("16 / 10"),
    Style.ObjectFit("cover"),
    Style.BorderRadius("8px"),
    Style.Color(tone.ink),
    Style.Outline("none"),
    Style.OutlineOffset("-1px"),
  );

const surface = () =>
  Element.Div(
    Style.Display("grid"),
    Style.AlignContent("end"),
    Style.Height("64px"),
    Style.Padding("10px 12px"),
    Style.BackgroundColor(tone.card),
    Style.Border("1px solid " + tone.hairline),
    Style.BorderRadius(radius.card),
    Style.BoxShadow("none"),
    Element.Span(Text("A card with an edge."), Style.FontSize("11.5px"), Style.Color(tone.muted)),
  );

const gear = () =>
  Element.Button(
    Property.Type("button"),
    Text("⚙"),
    ...iconButton(),
    Style.MinWidth("26px"),
    Style.MinHeight("26px"),
    Style.Padding("0"),
    Style.Margin("0"),
  );

const primaryPlain = () =>
  Element.Button(
    Property.Type("button"),
    Text("Continue"),
    Style.Appearance("none"),
    Style.FontFamily(sans),
    Style.FontSize("12.5px"),
    Style.Padding("8px 14px"),
    Style.BorderRadius("8px"),
    Style.Border("none"),
    Style.BackgroundColor(tone.ink),
    Style.Color(tone.background),
    Style.Cursor("pointer"),
    Style.BoxShadow("none"),
    Style.Transform("none"),
    Style.Transition("transform 160ms cubic-bezier(0.32, 0.72, 0, 1)"),
  );

const primaryProbed = () =>
  Element.Button(
    Property.Type("button"),
    Text("Continue"),
    Style.Appearance("none"),
    Style.FontFamily(sans),
    Style.FontSize("12.5px"),
    Style.Padding("8px 14px"),
    Style.BorderRadius("8px"),
    Style.Border("none"),
    Style.BackgroundColor(tone.ink),
    Style.Color(tone.background),
    Style.Cursor("pointer"),
    Style.BoxShadow("none"),
    Style.Transform("none"),
    Style.Transition("transform 160ms cubic-bezier(0.32, 0.72, 0, 1)"),
    PressProbe(),
  );

const cardButtonPlain = () =>
  Element.A(
    Property.Href("#"),
    Text("Hover this card"),
    Style.Display("grid"),
    Style.Gap("3px"),
    Style.TextAlign("left"),
    Style.Padding("10px 12px"),
    Style.BorderRadius("9px"),
    Style.Border("1px solid " + tone.hairline),
    Style.BackgroundColor("transparent"),
    Style.Color(tone.ink),
    Style.FontFamily(sans),
    Style.FontSize("12px"),
    Style.Cursor("pointer"),
    Style.BoxShadow("none"),
  );

const cardButtonProbed = () =>
  Element.A(
    Property.Href("#"),
    Text("Hover this card"),
    Style.Display("grid"),
    Style.Gap("3px"),
    Style.TextAlign("left"),
    Style.Padding("10px 12px"),
    Style.BorderRadius("9px"),
    Style.Border("1px solid " + tone.hairline),
    Style.BackgroundColor("transparent"),
    Style.Color(tone.ink),
    Style.FontFamily(sans),
    Style.FontSize("12px"),
    Style.Cursor("pointer"),
    Style.BoxShadow("none"),
    HoverProbe(),
  );

const logRows = [
  "Deploy finished in 2.4s",
  "Twelve routes prerendered",
  "No layout shift measured",
  "Cache warmed at the edge",
  "Images outlined at 10%",
  "Type set in one family",
  "Motion interrupts cleanly",
  "Press states feel physical",
];

const logFrame = <Probe extends TokenInstanceRef>(probe: Probe) =>
  Element.Div(
    Style.Height("124px"),
    Style.OverflowY("auto"),
    Style.Border("1px solid " + tone.hairline),
    Style.BorderRadius("9px"),
    Style.BackgroundColor(tone.background),
    Style.MaskImage("none"),
    probe,
    ...logRows.map(row =>
      Element.Div(
        Text(row),
        Style.Padding("6px 9px"),
        Style.FontSize("11.5px"),
        Style.Color(tone.muted),
        Style.BorderBottom("1px solid " + tone.hairline),
      ),
    ),
  );

const mover = (transition: string) =>
  Element.Div(
    Style.Width("132px"),
    Style.Height("38px"),
    Style.BorderRadius("8px"),
    Style.BackgroundColor(tone.ink),
    Style.Transform("translateX(-64px)"),
    Style.Transition(transition),
    Element.Div(
      Style.Width("12px"),
      Style.Height("12px"),
      Style.Margin("13px auto"),
      Style.BorderRadius("50%"),
      Style.BackgroundColor(tone.background),
    ),
  );

const motion = (smooth: boolean) =>
  Element.Div(
    Style.Display("grid"),
    Style.Gap("10px"),
    Style.JustifyItems("center"),
    Sliding(
      Moved(false),
      Smooth(smooth),
      Element.Div(
        Style.Display("flex"),
        Style.JustifyContent("center"),
        Style.Padding("4px 0"),
        Mover(mover(smooth ? "transform 420ms cubic-bezier(0.32, 0.72, 0, 1)" : "none")),
      ),
      Step(
        Element.Button(
          Property.Type("button"),
          Text("Move"),
          ...button(),
          Style.Padding("6px 10px"),
          Style.FontSize("11px"),
        ),
      ),
    ),
  );

/** The gallery: each tip is one rule and a pair of specimens. */
export const gallery = () =>
  Element.Div(
    Style.Display("grid"),
    Style.MaxWidth("760px"),
    Style.Margin("0 auto"),
    Style.Padding("40px 22px 90px"),
    Element.P(Text("Rulebook"), ...label(), Style.Margin("0 0 10px")),
    Element.H1(Text("Craft, as rules"), ...display()),
    Element.P(
      Text(
        "Twelve design-engineering tips from craft.gustavofior.com, each written as a Cascade rule. The left card is a plain control; the right opts into the marker token the rule watches. No rule styles a class: it reads a fact and writes one value.",
      ),
      ...prose(),
      Style.Margin("0 0 6px"),
    ),
    Element.P(
      Element.A(
        Text("Source: Craft by Gustavo Fior ↗"),
        Property.Href("https://craft.gustavofior.com"),
        Property.Rel("noreferrer"),
        Property.Target("_blank"),
        Style.Color(tone.muted),
        Style.FontSize("11.5px"),
        Style.TextDecoration("underline"),
        Style.TextDecorationColor(tone.strong),
        Style.TextUnderlineOffset("2px"),
      ),
      Style.Margin("0 0 26px"),
    ),
    section(
      "01",
      "Nested Border Radius",
      "An inner corner is the outer corner minus the gap. The rule derives the inner radius and clamps it at zero.",
      "NestedBox(Outer(40), Padding(20))",
      outerBox("20px", "40px", innerCard("40px")),
      NestedBox(Outer(40), Padding(20), outerBox("20px", "40px", InnerBox(innerCard("20px")))),
    ),
    section(
      "02",
      "Tabular Numbers",
      "Changing values keep their width. Both counters advance; only one reserves a slot per digit.",
      "Metric(Reading(), Steady())",
      metric(false),
      metric(true),
      ["proportional", "tabular"],
    ),
    section(
      "03",
      "Letter Spacing",
      "Tighten big text. The rule reads the size fact and derives the spacing.",
      "Tightened(Size(30))",
      headline(),
      Tightened(Size(30), headline()),
    ),
    section(
      "04",
      "Text Wrapping",
      "Balanced headings, no lonely last words.",
      "Balanced()",
      wrapFrame(heading()),
      wrapFrame(Balanced(heading())),
    ),
    section(
      "05",
      "Optical Alignment",
      "Center for the eye, not the math. Each glyph carries its own nudge.",
      "Optical(Glyph())",
      Element.Div(Style.Display("flex"), Style.Gap("8px"), glyph("▶"), glyph("★"), glyph("↓")),
      Element.Div(
        Style.Display("flex"),
        Style.Gap("8px"),
        Optical(Glyph("play"), glyph("▶")),
        Optical(Glyph("star"), glyph("★")),
        Optical(Glyph("arrow"), glyph("↓")),
      ),
    ),
    section(
      "06",
      "Image Outlines",
      "A faint inner edge frames images. Ten percent of the ink, drawn inside.",
      "Framed()",
      photo("beach.webp"),
      Framed(photo("clouds.webp")),
    ),
    section(
      "07",
      "Shadows, Not Borders",
      "An edge from layered shadows instead of a border, so it does not take space.",
      "Edged()",
      surface(),
      Edged(surface()),
    ),
    section(
      "08",
      "Hit Areas",
      "Make the target bigger than the icon. The rule grows the control and pulls the margin back, so the layout stays put.",
      "Target()",
      gear(),
      Target(gear()),
    ),
    section(
      "09",
      "Button Press",
      "Scale down on press so it feels real. The press is a fact; the scale follows it.",
      "Pressable(Pressed())",
      primaryPlain(),
      Pressable(Pressed(false), primaryProbed()),
    ),
    section(
      "10",
      "Hover Restraint",
      "Tint the surface and leave the layout alone. The tint is an inset shadow, so nothing moves.",
      "Tinted(Hovered())",
      cardButtonPlain(),
      Tinted(Hovered(false), cardButtonProbed()),
    ),
    section(
      "11",
      "Scroll Fades",
      "Fade only the edge that has more to scroll. Scroll position is a fact; the mask derives from it.",
      "Faded(MoreAbove(), MoreBelow())",
      logFrame(Element.Div()),
      Faded(MoreAbove(false), MoreBelow(true), logFrame(ScrollProbe())),
    ),
    section(
      "12",
      "Interruptibility",
      "Let people change their mind mid-motion. One transition from the current value; the plain mover jumps.",
      "Sliding(Moved(), Smooth())",
      motion(false),
      motion(true),
      ["jump", "transition"],
    ),
  );
