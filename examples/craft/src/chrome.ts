/** @since 0.4.0 */

import {Element, Property, Style} from "whuiy";
import {chapters, entries, type Chapter} from "./content.ts";
import {hueFor, lift, radius, sans, tone} from "./design.ts";
import {
  ChapterList,
  Control,
  Hovered,
  Knob,
  NavEntry,
  Open,
  Pressed,
  Query,
  Route,
  Results,
  SearchEmpty,
  SearchRow,
  SearchTrigger,
  Sheet,
  SheetClose,
  SheetHeader,
  SheetInput,
  Sidebar,
  Slug,
  Text,
  ThemeSwitch,
  TopNav,
} from "./tokens.ts";
import {hoverable, quietButton} from "./ui.ts";

const linkStyle = () =>
  [
    Style.Color(tone.muted),
    Style.FontWeight("400"),
    Style.BoxShadow("none"),
    Style.TextDecoration("none"),
    Style.FontSize("12.5px"),
    Style.LineHeight("1.7"),
    Style.Display("block"),
  ] as const;

/** One sidebar or top-nav destination, marked so the route can light it up. */
const navEntry = (slug: string, href: string, label: string, size = "12.5px") =>
  NavEntry(
    Slug(slug),
    Route(""),
    Control(
      Hovered(false),
      Pressed(false),
      Element.A(
        Text(label),
        Property.Href(href),
        ...hoverable(),
        ...linkStyle(),
        Style.FontSize(size),
        Style.Padding("2px 4px"),
        Style.Margin("0 -4px"),
        Style.BorderRadius("5px"),
        Style.Transition("color 140ms ease, background-color 140ms ease"),
      ),
    ),
  );

const themeSwitch = () =>
  ThemeSwitch(
    Control(
      Hovered(false),
      Pressed(false),
      Element.Button(
        Property.Type("button"),
        Property.Id("theme-switch"),
        ...hoverable(),
        ...quietButton(),
        Style.Padding("5px"),
        Element.Div(
          Style.Width("30px"),
          Style.Height("18px"),
          Style.BorderRadius(radius.pill),
          Style.BackgroundColor(tone.wash),
          Style.Border("1px solid " + tone.hairline),
          Style.Position("relative"),
          Style.Transition("background-color 160ms ease"),
          Knob(
            Element.Div(
              Style.Width("12px"),
              Style.Height("12px"),
              Style.BorderRadius("50%"),
              Style.BackgroundColor(tone.ink),
              Style.Transform("none"),
              Style.Position("absolute"),
              Style.Top("2px"),
              Style.Left("2px"),
              Style.Transition("transform 200ms cubic-bezier(0.32, 0.72, 0, 1)"),
            ),
          ),
        ),
      ),
    ),
  );

const header = () =>
  Element.Header(
    Style.Position("sticky"),
    Style.Top("0"),
    Style.ZIndex("40"),
    Style.Display("flex"),
    Style.AlignItems("center"),
    Style.JustifyContent("space-between"),
    Style.Padding("0 24px"),
    Style.Height("56px"),
    Style.BackgroundColor(tone.background),
    Style.BorderBottom("1px solid " + tone.hairline),
    Element.A(
      Text("Craft"),
      Property.Href("#/"),
      Style.FontFamily(sans),
      Style.FontSize("13.5px"),
      Style.FontWeight("600"),
      Style.LetterSpacing("-0.01em"),
      Style.Color(tone.ink),
      Style.TextDecoration("none"),
    ),
    Element.Div(
      Style.Display("flex"),
      Style.AlignItems("center"),
      Style.Gap("4px"),
      SearchTrigger(
        Control(
          Hovered(false),
          Pressed(false),
          Element.Button(
            Property.Type("button"),
            ...hoverable(),
            ...quietButton(),
            Text("Search"),
            Element.Kbd(
              Text("⌘K"),
              Style.FontFamily("inherit"),
              Style.FontSize("10.5px"),
              Style.Color(tone.faint),
              Style.Border("1px solid " + tone.hairline),
              Style.BorderRadius("4px"),
              Style.Padding("2px 4px"),
              Style.MarginLeft("2px"),
            ),
          ),
        ),
      ),
      themeSwitch(),
    ),
  );

const chapterLabel = (chapter: Chapter) =>
  Element.Div(
    Style.Display("flex"),
    Style.AlignItems("center"),
    Style.Gap("7px"),
    Style.Padding("0 6px"),
    Style.Margin("16px -6px 4px"),
    Element.Span(
      Style.Width("5px"),
      Style.Height("5px"),
      Style.BorderRadius("50%"),
      Style.BackgroundColor(hueFor(chapter)),
    ),
    Element.Span(
      Text(chapter),
      Style.FontFamily(sans),
      Style.FontSize("11.5px"),
      Style.FontWeight("500"),
      Style.Color(tone.ink),
    ),
  );

const chapterNav = () =>
  ChapterList(
    Element.Nav(
      Style.Display("grid"),
      Style.Gap("1px"),
      ...chapters.flatMap(chapter => [
        chapterLabel(chapter),
        ...entries
          .filter(entry => entry.chapter === chapter && entry.status === "published")
          .map(entry => navEntry("/" + entry.slug, "#/" + entry.slug, entry.title)),
      ]),
    ),
  );

const sidebar = () =>
  Sidebar(
    Element.Aside(
      Style.Position("sticky"),
      Style.Top("56px"),
      Style.AlignSelf("start"),
      Style.Display("grid"),
      Style.Gap("26px"),
      Style.MaxHeight("calc(100dvh - 56px)"),
      Style.Padding("30px 0 64px"),
      Style.OverflowY("auto"),
      TopNav(
        Element.Nav(
          Style.Display("grid"),
          Style.Gap("1px"),
          navEntry("/", "#/", "Index", "13px"),
          navEntry("/goats", "#/goats", "GOATs", "13px"),
          navEntry("/resources", "#/resources", "Resources", "13px"),
        ),
      ),
      chapterNav(),
    ),
  );

const resultRow = (slug: string, title: string, chapter: Chapter) =>
  Element.A(
    Property.Href("#/" + slug),
    Text(title),
    Element.Span(
      Text(chapter),
      Style.FontSize("10.5px"),
      Style.TextTransform("uppercase"),
      Style.LetterSpacing("0.05em"),
      Style.Color("#8b8b8b"),
    ),
    Style.Display("flex"),
    Style.AlignItems("baseline"),
    Style.JustifyContent("space-between"),
    Style.Gap("12px"),
    Style.Padding("8px 10px"),
    Style.BorderRadius("6px"),
    Style.Color("#ededed"),
    Style.TextDecoration("none"),
    Style.FontSize("13px"),
  );

/** The command palette. Its query lives inside it, so typing never rebuilds the input. */
const sheet = () =>
  Sheet(
    Open(false),
    Query(""),
    Element.Div(
      Style.Position("fixed"),
      Style.Inset("0"),
      Style.ZIndex("100"),
      Style.Display("none"),
      Style.BackgroundColor("rgb(0 0 0 / 34%)"),
      Style.BackdropFilter("blur(4px)"),
      Element.Div(
        Style.Width("min(560px, calc(100vw - 28px))"),
        Style.Margin("10vh auto 0"),
        Style.BackgroundColor("#171717"),
        Style.Color("#ededed"),
        Style.BorderRadius(radius.demo),
        Style.Border("1px solid rgb(255 255 255 / 8%)"),
        Style.BoxShadow(lift),
        Style.Overflow("hidden"),
        SheetHeader(
          Element.Div(
            Style.Display("flex"),
            Style.AlignItems("center"),
            Style.BorderBottom("1px solid rgb(255 255 255 / 7%)"),
            SheetInput(
              Element.Input(
                Property.Id("search-input"),
                Property.Type("search"),
                Property.Placeholder("Search concepts"),
                Style.Flex("1"),
                Style.BackgroundColor("transparent"),
                Style.Border("none"),
                Style.Outline("none"),
                Style.Padding("13px 15px"),
                Style.FontFamily(sans),
                Style.FontSize("14px"),
                Style.Color("#ededed"),
              ),
            ),
            SheetClose(
              Element.Button(
                Property.Type("button"),
                Text("esc"),
                Style.Appearance("none"),
                Style.BackgroundColor("transparent"),
                Style.Border("1px solid rgb(255 255 255 / 12%)"),
                Style.BorderRadius("5px"),
                Style.Color("#8b8b8b"),
                Style.FontFamily(sans),
                Style.FontSize("10.5px"),
                Style.Padding("3px 6px"),
                Style.MarginRight("12px"),
                Style.Cursor("pointer"),
              ),
            ),
          ),
        ),
        Element.Div(
          Results(
            ...entries
              .filter(entry => entry.status === "published")
              .map(entry =>
                SearchRow(
                  Slug("/" + entry.slug),
                  Query(""),
                  searchRow(entry.slug, entry.title, entry.chapter),
                ),
              ),
            SearchEmpty(
              Query(""),
              Element.P(
                Text("No concept matches that."),
                Style.Display("block"),
                Style.Padding("10px 12px"),
                Style.Margin("0"),
                Style.FontSize("12.5px"),
                Style.Color("#8b8b8b"),
              ),
            ),
          ),
          Style.Padding("6px"),
          Style.MaxHeight("min(320px, 50vh)"),
          Style.OverflowY("auto"),
          Style.Display("grid"),
          Style.Gap("1px"),
        ),
        Element.Div(
          Text("Walks the eleven published concepts. Soon entries stay unlisted."),
          Style.Padding("9px 15px"),
          Style.BorderTop("1px solid rgb(255 255 255 / 6%)"),
          Style.FontSize("11px"),
          Style.Color("#6b6b6b"),
        ),
      ),
    ),
  );

export const headerBar = () => header();

export const sidebarNav = () => sidebar();

export const searchSheet = () => sheet();

export const searchRow = resultRow;

/** Filler for the sheet before the first keystroke. */
export const emptyNote = (text: string) =>
  Element.P(
    Text(text),
    Style.FontSize("12px"),
    Style.Color("#8b8b8b"),
    Style.Margin("0"),
    Style.Padding("10px 12px"),
  );
