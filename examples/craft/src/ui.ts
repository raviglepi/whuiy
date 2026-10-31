/** @since 0.4.0 */

import {Element, Property, Style} from "whuiy";
import {mono, radius, sans, tone} from "./design.ts";
import {Hoverable, Text} from "./tokens.ts";

/**
 * Every helper returns fresh token instances. A token instance is a node in
 * the graph, so sharing one across two elements would make them one fact.
 */

/** Running text: 14px, generous leading, a soft reading colour. */
export const prose = () =>
  [
    Style.FontFamily(sans),
    Style.FontSize("14px"),
    Style.LineHeight("1.7"),
    Style.Color(tone.body),
    Style.Margin("0 0 14px"),
    Style.TextWrap("pretty"),
  ] as const;

/** A page title. Big text is tightened. */
export const title = () =>
  [
    Style.FontFamily(sans),
    Style.FontSize("21px"),
    Style.FontWeight("600"),
    Style.LetterSpacing("-0.015em"),
    Style.LineHeight("1.25"),
    Style.Color(tone.ink),
    Style.Margin("0 0 10px"),
    Style.TextWrap("balance"),
  ] as const;

/** A section heading inside an essay. */
export const heading = () =>
  [
    Style.FontFamily(sans),
    Style.FontSize("14px"),
    Style.FontWeight("600"),
    Style.LetterSpacing("-0.005em"),
    Style.Color(tone.ink),
    Style.Margin("28px 0 10px"),
    Style.LineHeight("1.4"),
  ] as const;

/** Small caps label, used for chapters and counts. */
export const eyebrow = () =>
  [
    Style.FontFamily(sans),
    Style.FontSize("11px"),
    Style.FontWeight("500"),
    Style.LetterSpacing("0.05em"),
    Style.TextTransform("uppercase"),
    Style.LineHeight("1.4"),
  ] as const;

/** Secondary text. */
export const small = () =>
  [Style.FontFamily(sans), Style.FontSize("12.5px"), Style.LineHeight("1.6")] as const;

/** A hairline that reads as a rule, not a border. */
export const hairline = () =>
  [Style.Height("1px"), Style.BackgroundColor(tone.hairline), Style.Flex("1")] as const;

/** The base of every boxed control on the site. */
export const buttonBase = () =>
  [
    Style.Appearance("none"),
    Style.BackgroundColor("transparent"),
    Style.Border("1px solid " + tone.hairline),
    Style.BoxShadow("none"),
    Style.Transform("none"),
    Style.BorderRadius(radius.control),
    Style.Color(tone.muted),
    Style.FontFamily(sans),
    Style.FontSize("12px"),
    Style.LineHeight("1"),
    Style.Padding("6px 9px"),
    Style.Display("inline-flex"),
    Style.AlignItems("center"),
    Style.Gap("6px"),
    Style.Cursor("pointer"),
    Style.Transition("background-color 140ms ease, transform 140ms ease, color 140ms ease"),
  ] as const;

/** A plain text control: no box until it is hovered. */
export const quietButton = () =>
  [
    Style.Appearance("none"),
    Style.BackgroundColor("transparent"),
    Style.Border("none"),
    Style.BoxShadow("none"),
    Style.Transform("none"),
    Style.BorderRadius(radius.control),
    Style.Color(tone.muted),
    Style.FontFamily(sans),
    Style.FontSize("12px"),
    Style.LineHeight("1"),
    Style.Padding("6px 7px"),
    Style.Display("inline-flex"),
    Style.AlignItems("center"),
    Style.Gap("6px"),
    Style.Cursor("pointer"),
    Style.Transition("background-color 140ms ease, color 140ms ease"),
  ] as const;

export const linkBase = () =>
  [
    Style.Color("inherit"),
    Style.TextDecoration("underline"),
    Style.TextDecorationColor(tone.strong),
    Style.TextUnderlineOffset("2px"),
  ] as const;

export const inlineCode = () =>
  [
    Style.FontFamily(mono),
    Style.FontSize("0.86em"),
    Style.BackgroundColor(tone.wash),
    Style.Color(tone.ink),
    Style.Padding("1px 4px"),
    Style.BorderRadius("4px"),
  ] as const;

/** Marks an element whose pointer facts a rule publishes. */
export const hoverable = () => [Hoverable()] as const;

const codePattern = /(`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/;

const at = (parts: readonly string[], index: number): string => parts[index] ?? "";

const markdownLink = (part: string) => {
  const parts = linkPattern.exec(part);
  if (parts === null) return Text(part);
  return Element.A(
    Text(at(parts, 1)),
    Property.Href(at(parts, 2)),
    Property.Rel("noreferrer"),
    ...linkBase(),
  );
};

const piece = (part: string) => {
  if (part.startsWith("`")) return Element.Code(Text(part.slice(1, -1)), ...inlineCode());
  if (part.startsWith("[")) return markdownLink(part);
  return Text(part);
};

/** Renders inline backticks and markdown links inside one paragraph. */
export const inline = (value: string) =>
  value
    .split(codePattern)
    .filter(part => part.length > 0)
    .map(piece);

/** A paragraph of prose with its inline code and links. */
export const paragraph = (value: string) => Element.P(...prose(), ...inline(value));
