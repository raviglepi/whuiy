/** @since 0.4.0 */

import {Element, Style} from "whuiy";
import {mono, radius, sans, tone} from "./design.ts";
import {Text} from "./tokens.ts";

/** Every helper returns fresh token instances: a token instance is a node. */

export const prose = () =>
  [
    Style.FontFamily(sans),
    Style.FontSize("13.5px"),
    Style.LineHeight("1.65"),
    Style.Color(tone.body),
    Style.Margin("0"),
    Style.TextWrap("pretty"),
  ] as const;

export const display = () =>
  [
    Style.FontFamily(sans),
    Style.FontSize("26px"),
    Style.FontWeight("600"),
    Style.LetterSpacing("-0.02em"),
    Style.LineHeight("1.15"),
    Style.Color(tone.ink),
    Style.Margin("0 0 10px"),
  ] as const;

export const label = () =>
  [
    Style.FontFamily(sans),
    Style.FontSize("10px"),
    Style.FontWeight("500"),
    Style.LetterSpacing("0.08em"),
    Style.TextTransform("uppercase"),
    Style.Color(tone.faint),
    Style.LineHeight("1"),
  ] as const;

export const ruleChip = (value: string) =>
  Element.Code(
    Text(value),
    Style.FontFamily(mono),
    Style.FontSize("10.5px"),
    Style.Color(tone.muted),
    Style.BackgroundColor(tone.wash),
    Style.BorderRadius("5px"),
    Style.Padding("3px 6px"),
  );

export const hairline = () =>
  [Style.Height("1px"), Style.BackgroundColor(tone.hairline), Style.Flex("1")] as const;

export const button = () =>
  [
    Style.Appearance("none"),
    Style.FontFamily(sans),
    Style.FontSize("12px"),
    Style.LineHeight("1"),
    Style.Color(tone.muted),
    Style.BackgroundColor("transparent"),
    Style.Border("1px solid " + tone.hairline),
    Style.BorderRadius(radius.control),
    Style.Padding("7px 10px"),
    Style.Cursor("pointer"),
    Style.Transition("background-color 140ms ease, transform 140ms ease, box-shadow 140ms ease"),
  ] as const;

export const iconButton = () =>
  [
    Style.Appearance("none"),
    Style.FontFamily(sans),
    Style.LineHeight("1"),
    Style.Color(tone.muted),
    Style.BackgroundColor("transparent"),
    Style.Border("1px solid " + tone.hairline),
    Style.Display("inline-grid"),
    Style.PlaceItems("center"),
    Style.Padding("0"),
    Style.Width("26px"),
    Style.Height("26px"),
    Style.BorderRadius("50%"),
    Style.FontSize("11px"),
  ] as const;

export const card = () =>
  [
    Style.Display("grid"),
    Style.Gap("8px"),
    Style.AlignContent("start"),
    Style.Padding("14px"),
    Style.BackgroundColor(tone.card),
    Style.BorderRadius(radius.panel),
    Style.Border("1px solid " + tone.hairline),
  ] as const;

export const quietLink = () =>
  [Style.Color("inherit"), Style.TextDecoration("none"), Style.FontSize("12.5px")] as const;
