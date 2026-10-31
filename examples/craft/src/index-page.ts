/** @since 0.4.0 */

import type {Chapter, Entry, Link} from "./content.ts";

import {Element, Property, Style} from "whuiy";
import {chapters, entries, goats, intro, resources} from "./content.ts";
import {hueFor, mono, radius, tone} from "./design.ts";
import {Columns, Entry as EntryToken, Hovered, Page, Route, Slug, Text} from "./tokens.ts";
import {eyebrow, hairline, heading, hoverable, paragraph, prose, small, title} from "./ui.ts";

const body = () =>
  [
    Style.Display("grid"),
    Style.GridTemplateColumns("minmax(0, 1fr)"),
    Style.MaxWidth("660px"),
    Style.MinWidth("0"),
    Style.Padding("44px 0 96px"),
  ] as const;

const soonBadge = () =>
  Element.Span(
    Text("Soon"),
    Style.FontFamily(mono),
    Style.FontSize("9.5px"),
    Style.LetterSpacing("0.06em"),
    Style.TextTransform("uppercase"),
    Style.Color(tone.faint),
    Style.Border("1px solid " + tone.hairline),
    Style.BorderRadius("4px"),
    Style.Padding("2px 5px"),
    Style.JustifySelf("start"),
  );

const entryStyles = () =>
  [
    Style.Display("grid"),
    Style.AlignContent("start"),
    Style.Gap("3px"),
    Style.BoxShadow("none"),
    Style.Padding("10px 11px"),
    Style.Margin("0 -11px"),
    Style.BorderRadius(radius.control),
    Style.TextDecoration("none"),
    Style.Transition("background-color 160ms ease"),
  ] as const;

const entryTitle = (published: boolean) =>
  [
    Style.FontSize("13px"),
    Style.FontWeight("500"),
    Style.LineHeight("1.4"),
    Style.Color(published ? tone.ink : tone.muted),
  ] as const;

const entryTagline = (published: boolean) =>
  [
    Style.FontSize("12px"),
    Style.LineHeight("1.55"),
    Style.Color(published ? tone.muted : tone.faint),
  ] as const;

const entryBody = () =>
  [Style.Display("grid"), Style.Gap("3px"), Style.TextDecoration("none")] as const;

const entry = (value: Entry) =>
  EntryToken(
    Slug(value.slug),
    Hovered(false),
    value.status === "published"
      ? Element.Div(
          ...hoverable(),
          Element.A(
            Property.Href("#/" + value.slug),
            Element.Span(Text(value.title), ...entryTitle(true)),
            Element.Span(Text(value.tagline), ...entryTagline(true)),
            ...entryBody(),
          ),
          ...entryStyles(),
        )
      : Element.Div(
          ...hoverable(),
          Element.Div(
            Style.Display("flex"),
            Style.AlignItems("center"),
            Style.JustifyContent("space-between"),
            Style.Gap("8px"),
            Element.Span(Text(value.title), ...entryTitle(false)),
            soonBadge(),
          ),
          Element.Span(Text(value.tagline), ...entryTagline(false)),
          ...entryStyles(),
        ),
  );

const chapterSection = (chapter: Chapter) => {
  const inside = entries.filter(value => value.chapter === chapter);
  return Element.Section(
    Style.Margin("0 0 30px"),
    Element.Div(
      Style.Display("flex"),
      Style.AlignItems("center"),
      Style.Gap("8px"),
      Style.Margin("0 0 6px"),
      Element.Span(
        Style.Width("5px"),
        Style.Height("5px"),
        Style.BorderRadius("50%"),
        Style.BackgroundColor(hueFor(chapter)),
      ),
      Element.Span(
        Text(chapter),
        Style.FontSize("12px"),
        Style.FontWeight("500"),
        Style.Color(tone.ink),
      ),
      Element.Div(...hairline()),
      Element.Span(
        Text(String(inside.length).padStart(2, "0")),
        Style.FontFamily(mono),
        Style.FontSize("10px"),
        Style.Color(tone.faint),
      ),
    ),
    Columns(
      Element.Div(
        Style.Display("grid"),
        Style.GridTemplateColumns("1fr 1fr"),
        Style.ColumnGap("18px"),
        Style.RowGap("2px"),
        ...inside.map(entry),
      ),
    ),
  );
};

const note = () =>
  Element.P(
    Text(
      "This index is a description, not markup. Each entry is a fact, the chapters group those facts, and the route decides which page is shown. The essays, their demos, and the palette follow from rules rather than from a template.",
    ),
    ...small(),
    Style.Color(tone.muted),
    Style.Margin("0 0 34px"),
    Style.Padding("12px 14px"),
    Style.BorderLeft("2px solid " + tone.strong),
    Style.BackgroundColor(tone.wash),
    Style.BorderRadius("0 8px 8px 0"),
  );

/** The index: every concept, grouped by the chapter that holds it. */
export const indexPage = () =>
  Page(
    Slug("/"),
    Route(""),
    Element.Main(
      ...body(),
      Element.H1(Text("Index"), ...title()),
      ...intro.map(paragraph),
      Element.P(
        Element.Code(
          Text("npx skills add gustavo-fior/craft"),
          Style.FontFamily(mono),
          Style.FontSize("12px"),
          Style.BackgroundColor(tone.wash),
          Style.Color(tone.ink),
          Style.Padding("5px 8px"),
          Style.BorderRadius("6px"),
        ),
        Style.Margin("0 0 20px"),
      ),
      note(),
      ...chapters.map(chapterSection),
    ),
  );

const person = (link: Link) => {
  const [name = link.text, role] = link.text.split("∙");
  return Element.A(
    Text(name.trim()),
    Property.Href(link.href),
    Property.Rel("noreferrer"),
    Property.Target("_blank"),
    Style.Display("grid"),
    Style.Gap("2px"),
    Style.Padding("10px 0"),
    Style.BorderTop("1px solid " + tone.hairline),
    Style.TextDecoration("none"),
    Style.Color(tone.ink),
    Style.FontSize("13.5px"),
    role === undefined
      ? Element.Div()
      : Element.Span(Text(role.trim()), ...small(), Style.Color(tone.muted)),
  );
};

/** The people whose work taught the site. */
export const goatsPage = () =>
  Page(
    Slug("/goats"),
    Route(""),
    Element.Main(
      ...body(),
      Element.H1(Text("GOATs"), ...title()),
      paragraph(
        "Nothing here is original. These are the people whose writing, demos, and open-source work taught me most of what this site tries to pass on.",
      ),
      Element.Div(Style.Margin("0 0 24px"), ...goats.map(person)),
    ),
  );

const resourceLink = (link: Link) => person(link);

/** The vaults, courses, icon sets, and references behind the essays. */
export const resourcesPage = () =>
  Page(
    Slug("/resources"),
    Route(""),
    Element.Main(
      ...body(),
      Element.H1(Text("Resources"), ...title()),
      paragraph(
        "Tools and references I keep coming back to. Each concept page also lists the specific posts it draws from.",
      ),
      ...resources.map(group =>
        Element.Section(
          Element.H2(Text(group.heading), ...heading(), Style.Margin("24px 0 4px")),
          Element.Div(...group.links.map(resourceLink)),
        ),
      ),
    ),
  );

export const pages = () => [indexPage(), goatsPage(), resourcesPage()];

export const proseLink = (href: string, label: string) =>
  Element.A(Property.Href(href), Text(label), ...prose(), Style.Color(tone.ink));

export const sectionLabel = (value: string) => Element.Span(Text(value), ...eyebrow());
