/** @since 0.4.0 */

import type {Block, Essay, Link, Resource} from "./content.ts";

import {Match} from "effect";

import {Element, Property, Style} from "whuiy";
import {demoFor} from "./demos.ts";
import {hueFor, mono, tone} from "./design.ts";
import {Page, Route, Slug, Text} from "./tokens.ts";
import {eyebrow, heading, inline, linkBase, paragraph, prose, small, title} from "./ui.ts";

const codeBlock = (block: Extract<Block, {readonly kind: "code"}>) =>
  Element.Figure(
    Style.Margin("0 0 18px"),
    Style.MinWidth("0"),
    Style.MaxWidth("100%"),
    Style.BackgroundColor("#161616"),
    Style.Border("1px solid rgb(255 255 255 / 6%)"),
    Style.BorderRadius("10px"),
    Style.Overflow("hidden"),
    Element.Figcaption(
      Text(block.filename ?? "snippet"),
      Style.FontFamily(mono),
      Style.FontSize("10.5px"),
      Style.Color("#8b8b8b"),
      Style.Padding("8px 12px"),
      Style.BorderBottom("1px solid rgb(255 255 255 / 7%)"),
    ),
    Element.Pre(
      Element.Code(
        Text(block.code),
        Style.FontFamily(mono),
        Style.FontSize("11.5px"),
        Style.LineHeight("1.7"),
        Style.Color("#ededed"),
      ),
      Style.Margin("0"),
      Style.MinWidth("0"),
      Style.MaxWidth("100%"),
      Style.Padding("12px 14px"),
      Style.OverflowX("auto"),
    ),
  );

const bullets = (items: readonly string[]) =>
  Element.Ul(
    ...items.map(item => Element.Li(...prose(), ...inline(item), Style.Margin("0 0 6px"))),
    Style.Margin("0 0 14px"),
    Style.PaddingLeft("18px"),
    Style.Color(tone.body),
  );

const quoted = (block: Extract<Block, {readonly kind: "quote"}>) =>
  Element.Blockquote(
    Element.P(...prose(), ...inline(block.text), Style.Margin("0")),
    Style.Margin("0 0 16px"),
    Style.PaddingLeft("14px"),
    Style.BorderLeft("2px solid " + tone.strong),
    Style.FontStyle("italic"),
    Style.Color(tone.ink),
  );

/** One content block, matched to the shape it reads as. */
export const block = (value: Block) =>
  Match.value(value).pipe(
    Match.when({kind: "code"}, codeBlock),
    Match.when({kind: "list"}, list => bullets(list.items)),
    Match.when({kind: "quote"}, quoted),
    Match.when({kind: "prose"}, text => paragraph(text.text)),
    Match.exhaustive,
  );

const resource = (entry: Resource) =>
  Element.Div(
    Style.Display("grid"),
    Style.Gap("2px"),
    Style.Padding("9px 0"),
    Style.BorderTop("1px solid " + tone.hairline),
    Element.A(
      Text(entry.title),
      Property.Href(entry.href),
      Property.Rel("noreferrer"),
      Property.Target("_blank"),
      ...linkBase(),
      Style.FontSize("13px"),
      Style.Color(tone.ink),
      Style.TextDecoration("none"),
      Style.Display("inline-flex"),
      Style.Gap("4px"),
      Element.Span(Text("↗"), Style.Color(tone.faint), Style.FontSize("11px")),
    ),
    Element.P(Text(entry.blurb), ...small(), Style.Margin("0")),
  );

const turn = (href: string, label: string, align: "left" | "right") =>
  Element.A(
    Text(label),
    Property.Href(href),
    Style.FontSize("12.5px"),
    Style.Color(tone.muted),
    Style.TextDecoration("none"),
    Style.TextAlign(align),
    Style.Display("block"),
    Style.Padding("10px 0"),
  );

const target = (link: Link | undefined): string => {
  const slug = link?.href.split("/").pop() ?? "";
  return "#/" + slug;
};

const label = (link: Link | undefined, fallback: string): string => link?.text ?? fallback;

const headingOrGap = (value: string | undefined) =>
  value === undefined ? Element.Div() : Element.H2(Text(value), ...heading());

const demoOrGap = (slug: string, index: number) =>
  index === 0 ? (demoFor(slug) ?? Element.Div()) : Element.Div();

const section = (value: Essay["sections"][number], slug: string, index: number) =>
  Element.Section(headingOrGap(value.heading), ...value.blocks.map(block), demoOrGap(slug, index));

const footer = (essay: Essay) =>
  Element.Nav(
    turn(target(essay.prev), "← " + label(essay.prev, "Index"), "left"),
    turn(target(essay.next), label(essay.next, "Index") + " →", "right"),
    Style.Display("grid"),
    Style.GridTemplateColumns("1fr 1fr"),
    Style.Gap("16px"),
    Style.MarginTop("36px"),
    Style.BorderTop("1px solid " + tone.hairline),
  );

/** One essay page: prose, its demo, its sources, and the way onward. */
export const essayPage = (essay: Essay) =>
  Page(
    Slug("/" + essay.slug),
    Route(""),
    Element.Article(
      Style.Display("grid"),
      Style.GridTemplateColumns("minmax(0, 1fr)"),
      Style.MaxWidth("620px"),
      Style.MinWidth("0"),
      Style.Padding("44px 0 96px"),
      Element.P(
        Text(essay.chapter),
        ...eyebrow(),
        Style.Color(hueFor(essay.chapter)),
        Style.Margin("0 0 10px"),
      ),
      Element.H1(Text(essay.title), ...title()),
      Element.P(Text(essay.tagline), ...small(), Style.Color(tone.muted), Style.Margin("0 0 22px")),
      ...essay.sections.map((value, index) => section(value, essay.slug, index)),
      essay.resources.length === 0
        ? Element.Div()
        : Element.Section(
            Element.H2(Text("Resources"), ...heading(), Style.Margin("36px 0 4px")),
            ...essay.resources.map(resource),
          ),
      footer(essay),
    ),
  );
