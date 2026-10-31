/** @since 0.4.0 */

import type {LiveToken, TokenDefinitionRef} from "whuiy";

import {Effect} from "effect";

import {Element, Event, Style, Token, Whuiy} from "whuiy";
import {headerBar, searchSheet, sidebarNav} from "./chrome.ts";
import {entries, essays, type Entry} from "./content.ts";
import {sans, tint, tone} from "./design.ts";
import {essayPage} from "./essay.ts";
import {pages} from "./index-page.ts";
import {
  Body,
  ChapterList,
  Chip,
  Chrome,
  Control,
  Controls,
  Craft,
  Entry as EntryToken,
  Hoverable,
  Hovered,
  InnerPadding,
  Knob,
  Layout,
  Narrow,
  NavEntry,
  NestedDemo,
  NestedReadout,
  Numbers,
  NumericDemo,
  Open,
  OuterInput,
  OuterRadius,
  Outlined,
  OutlineChoice,
  OutlineDemo,
  OutlineReadout,
  OutlineStrength,
  OutlineStrengthInput,
  Page,
  PaddingInput,
  Photos,
  Pressed,
  ProportionalColumn,
  ProportionalValue,
  Query,
  ReadoutRow,
  Reading,
  Results,
  Revealed,
  RevealDemo,
  Route,
  SearchTrigger,
  SearchEmpty,
  SearchRow,
  Selected,
  Sheet,
  SheetClose,
  SheetHeader,
  SheetInput,
  Sidebar,
  Slug,
  Stack,
  Stage,
  TabularColumn,
  TabularValue,
  Theme,
  ThemeSwitch,
  TopNav,
} from "./tokens.ts";

/** A missing value reads as its documented default, never as undefined. */
const asText = (value: string | undefined, fallback: string): string => value ?? fallback;

const asNumber = (value: number | undefined, fallback: number): number => value ?? fallback;

const isOn = (value: boolean | undefined): boolean => value === true;

/** The one place a boolean fact picks its presentation. */
const either = <Value>(flag: boolean, yes: Value, no: Value): Value => (flag ? yes : no);

const sheen = (lit: boolean, percent: number): string =>
  either(lit, "inset 0 0 0 999px " + tint(percent), "none");

const press = (down: boolean): string => either(down, "scale(0.97)", "none");

const inputText = (event: Event, fallback: string): string => {
  const target = event.target;
  return target instanceof HTMLInputElement ? target.value : fallback;
};

const inputNumber = (event: Event, fallback: number): number => {
  const target = event.target;
  return target instanceof HTMLInputElement ? target.valueAsNumber : fallback;
};

const canvasOf = (craft: LiveToken) => craft.get(Body).get(Element.Div);

/**
 * The graph is undirected, so a node inside a `<div>` has two div relations:
 * its own child and its owner. A node's own relations are listed first.
 */
const inner = <Target extends TokenDefinitionRef>(node: LiveToken, target: Target) => {
  const [found] = node.all(target);
  if (found === undefined) throw new Error(`Token ${node.definition.name} has no ${target.name}`);
  return found;
};

const layoutOf = (craft: LiveToken) => inner(canvasOf(craft).get(Layout), Element.Div);

const frameOf = (demo: LiveToken) => inner(demo, Element.Section);

const stackOf = (craft: LiveToken) => layoutOf(craft).get(Element.Main).get(Stack);

const sidebarOf = (craft: LiveToken) => layoutOf(craft).get(Sidebar).get(Element.Aside);

const headerOf = (craft: LiveToken) => canvasOf(craft).get(Chrome).get(Element.Header);

const sheetOf = (craft: LiveToken) => canvasOf(craft).get(Sheet);

const panelOfSheet = (sheet: LiveToken) => inner(inner(sheet, Element.Div), Element.Div);

const published = entries.filter(entry => entry.status === "published");

/** A query narrows the index to the concepts it names. */
const matching = (query: string): readonly Entry[] => {
  const needle = query.trim().toLowerCase();
  if (needle === "") return published.slice(0, 7);
  return published.filter(entry =>
    (entry.title + " " + entry.tagline + " " + entry.chapter).toLowerCase().includes(needle),
  );
};

const closeOnEnter =
  (open: LiveToken<typeof Open>, query: LiveToken<typeof Query>) => (event: KeyboardEvent) => {
    if (event.key !== "Enter") return Effect.void;
    const first = matching(asText(query.value(), ""))[0];
    if (first === undefined) return Effect.void;
    globalThis.location.hash = "#/" + first.slug;
    return open.pipe(Token.setValue(false));
  };

const closeOnBackdrop = (open: LiveToken<typeof Open>) => (event: MouseEvent) =>
  either(event.target === event.currentTarget, open.pipe(Token.setValue(false)), Effect.void);

/** @since 0.4.0 */
export const description = Craft(
  Theme(prefersDark() ? "dark" : "light"),
  Route(initialRoute()),
  Narrow(isNarrow()),
  Body(
    Element.Div(
      Style.MinHeight("100dvh"),
      Style.BackgroundColor(tone.background),
      Style.Color(tone.ink),
      Style.FontFamily(sans),
      Style.FontSize("14px"),
      Style.ColorScheme(either(prefersDark(), "dark", "light")),
      Chrome(headerBar()),
      Layout(
        Element.Div(
          Style.Display("grid"),
          Style.GridTemplateColumns("212px minmax(0, 632px)"),
          Style.ColumnGap("76px"),
          Style.MaxWidth("1080px"),
          Style.Margin("0 auto"),
          Style.Padding("0 24px"),
          Style.AlignItems("start"),
          sidebarNav(),
          Element.Main(Style.MinWidth("0"), Stack(...pages(), ...essays.map(essayPage))),
        ),
      ),
      searchSheet(),
    ),
  ),
);

/** The route is a fact; see the `Craft(Route())` rule for who reads it. */
export const routeOf = (root: LiveToken) => root.get(Route);

/** The viewport is a fact too, so the layout can follow it. */
export const narrowOf = (root: LiveToken) => root.get(Narrow);

/** The search sheet's open flag, for the keyboard shortcuts the browser owns. */
export const sheetOpenOf = (root: LiveToken) =>
  root.get(Body).get(Element.Div).get(Sheet).get(Open);

/** Writes one route value into every slot that reads it. */
function* shareRoute(nodes: readonly LiveToken[], route: string) {
  for (const node of nodes) yield* node.get(Route).pipe(Token.setValue(route));
}

/** @since 0.4.0 */
export const ui = new Whuiy()
  // The palette is one fact on the canvas; light-dark() resolves every colour.
  .rule(Craft(Theme()), function* (craft) {
    const dark = craft.get(Theme).value() === "dark";
    yield* canvasOf(craft)
      .get(Style.ColorScheme)
      .pipe(Token.setValue(either(dark, "dark", "light")));
    yield* headerOf(craft)
      .get(Element.Div)
      .get(ThemeSwitch)
      .get(Control)
      .get(Element.Button)
      .get(Element.Div)
      .get(Knob)
      .pipe(node => inner(node, Element.Div))
      .get(Style.Transform)
      .pipe(Token.setValue(either(dark, "translateX(12px)", "translateX(0px)")));
  })
  // The header owns both root-level controls, so it can write their facts.
  .rule(Craft(), function* (craft) {
    const theme = craft.get(Theme);
    const open = sheetOf(craft).get(Open);
    const query = sheetOf(craft).get(Query);
    yield* headerOf(craft)
      .get(Element.Div)
      .get(ThemeSwitch)
      .get(Control)
      .get(Element.Button)
      .pipe(
        Token.add(
          Event.OnClick(() =>
            theme.pipe(Token.setValue(either(theme.value() === "dark", "light", "dark"))),
          ),
        ),
      );
    yield* headerOf(craft)
      .get(Element.Div)
      .get(SearchTrigger)
      .get(Control)
      .get(Element.Button)
      .pipe(
        Token.add(
          Event.OnClick(() =>
            Effect.gen(function* () {
              yield* query.pipe(Token.setValue(""));
              yield* open.pipe(Token.setValue(true));
            }),
          ),
        ),
      );
  })
  // Every page and nav entry already holds a route slot; the root fact fills it.
  .rule(Craft(Route()), function* (craft) {
    const route = asText(craft.get(Route).value(), "/");
    yield* shareRoute(stackOf(craft).all(Page), route);
    yield* shareRoute(sidebarOf(craft).get(TopNav).get(Element.Nav).all(NavEntry), route);
    yield* shareRoute(sidebarOf(craft).get(ChapterList).get(Element.Nav).all(NavEntry), route);
  })
  // A page is shown when the route names it.
  .rule(Page(Slug(), Route(), Element.Main()), function* (page) {
    const shown = asText(page.get(Slug).value(), "/") === asText(page.get(Route).value(), "/");
    yield* page
      .get(Element.Main)
      .get(Style.Display)
      .pipe(Token.setValue(either(shown, "grid", "none")));
  })
  .rule(Page(Slug(), Route(), Element.Article()), function* (page) {
    const shown = asText(page.get(Slug).value(), "/") === asText(page.get(Route).value(), "/");
    yield* page
      .get(Element.Article)
      .get(Style.Display)
      .pipe(Token.setValue(either(shown, "grid", "none")));
  })
  // A nav entry is lit when the route names it.
  .rule(NavEntry(Slug(), Route()), function* (nav) {
    const active = asText(nav.get(Slug).value(), "") === asText(nav.get(Route).value(), "/");
    const link = nav.get(Control).get(Element.A);
    yield* link.get(Style.Color).pipe(Token.setValue(either(active, tone.ink, tone.muted)));
    yield* link.get(Style.FontWeight).pipe(Token.setValue(either(active, "500", "400")));
  })
  // Narrow is a fact about the window; the layout follows it.
  .rule(Craft(Narrow()), function* (craft) {
    const narrow = isOn(craft.get(Narrow).value());
    const layout = layoutOf(craft);
    yield* layout
      .get(Style.GridTemplateColumns)
      .pipe(Token.setValue(either(narrow, "minmax(0, 1fr)", "212px minmax(0, 632px)")));
    yield* layout.get(Style.ColumnGap).pipe(Token.setValue(either(narrow, "0px", "76px")));
    yield* layout.get(Style.MaxWidth).pipe(Token.setValue(either(narrow, "660px", "1080px")));
    yield* layout.get(Style.Padding).pipe(Token.setValue(either(narrow, "0 20px", "0 24px")));
    const aside = sidebarOf(craft);
    yield* aside.get(Style.Position).pipe(Token.setValue(either(narrow, "static", "sticky")));
    yield* aside
      .get(Style.MaxHeight)
      .pipe(Token.setValue(either(narrow, "none", "calc(100dvh - 56px)")));
    yield* aside
      .get(Style.Padding)
      .pipe(Token.setValue(either(narrow, "18px 0 4px", "30px 0 64px")));
    yield* aside
      .get(ChapterList)
      .get(Element.Nav)
      .get(Style.Display)
      .pipe(Token.setValue(either(narrow, "none", "block")));
    const top = aside.get(TopNav).get(Element.Nav);
    yield* top.get(Style.Display).pipe(Token.setValue(either(narrow, "flex", "grid")));
    yield* top.get(Style.Gap).pipe(Token.setValue(either(narrow, "10px", "1px")));
  })
  // A hoverable element publishes its pointer facts; a control draws them.
  .rule(Element.Button(Hoverable(), Control()), function* (button) {
    const control = button.get(Control);
    const hovered = control.get(Hovered);
    const pressed = control.get(Pressed);
    yield* button.pipe(
      Token.add(
        Event.OnPointerenter(() => hovered.pipe(Token.setValue(true))),
        Event.OnPointerleave(() =>
          Effect.gen(function* () {
            yield* hovered.pipe(Token.setValue(false));
            yield* pressed.pipe(Token.setValue(false));
          }),
        ),
        Event.OnPointerdown(() => pressed.pipe(Token.setValue(true))),
        Event.OnPointerup(() => pressed.pipe(Token.setValue(false))),
      ),
    );
  })
  .rule(Element.A(Hoverable(), Control()), function* (anchor) {
    const hovered = anchor.get(Control).get(Hovered);
    yield* anchor.pipe(
      Token.add(
        Event.OnPointerenter(() => hovered.pipe(Token.setValue(true))),
        Event.OnPointerleave(() => hovered.pipe(Token.setValue(false))),
      ),
    );
  })
  .rule(Element.Div(Hoverable(), EntryToken()), function* (div) {
    const hovered = div.get(EntryToken).get(Hovered);
    yield* div.pipe(
      Token.add(
        Event.OnPointerenter(() => hovered.pipe(Token.setValue(true))),
        Event.OnPointerleave(() => hovered.pipe(Token.setValue(false))),
      ),
    );
  })
  .rule(Control(Hovered(), Pressed(), Element.Button()), function* (control) {
    const button = control.get(Element.Button);
    yield* button
      .get(Style.BoxShadow)
      .pipe(Token.setValue(sheen(isOn(control.get(Hovered).value()), 6)));
    yield* button
      .get(Style.Transform)
      .pipe(Token.setValue(press(isOn(control.get(Pressed).value()))));
  })
  .rule(Control(Hovered(), Element.A()), function* (control) {
    yield* control
      .get(Element.A)
      .get(Style.BoxShadow)
      .pipe(Token.setValue(sheen(isOn(control.get(Hovered).value()), 5)));
  })
  .rule(Chip(Selected(), Element.Button()), function* (chip) {
    const selected = isOn(chip.get(Selected).value());
    const button = chip.get(Element.Button);
    yield* button
      .get(Style.BackgroundColor)
      .pipe(Token.setValue(either(selected, tint(9), "transparent")));
    yield* button
      .get(Style.BorderColor)
      .pipe(Token.setValue(either(selected, tint(12), "transparent")));
    yield* button.get(Style.Color).pipe(Token.setValue(either(selected, tone.ink, tone.muted)));
    yield* button.get(Style.Opacity).pipe(Token.setValue(either(selected, "1", "0.78")));
  })
  .rule(EntryToken(Hovered(), Element.Div()), function* (entry) {
    yield* inner(entry, Element.Div)
      .get(Style.BoxShadow)
      .pipe(Token.setValue(sheen(isOn(entry.get(Hovered).value()), 4)));
  })
  // Search: the query lives in the sheet, so the input is never rebuilt.
  .rule(Sheet(Open()), function* (sheet) {
    yield* inner(sheet, Element.Div)
      .get(Style.Display)
      .pipe(Token.setValue(either(isOn(sheet.get(Open).value()), "block", "none")));
  })
  .rule(Sheet(Query()), function* (sheet) {
    const query = asText(sheet.get(Query).value(), "");
    const results = inner(panelOfSheet(sheet), Element.Div).get(Results);
    for (const row of results.all(SearchRow)) {
      yield* row.get(Query).pipe(Token.setValue(query));
    }
    for (const empty of results.all(SearchEmpty)) {
      yield* empty.get(Query).pipe(Token.setValue(query));
    }
  })
  // One row is listed when the query names it.
  .rule(SearchRow(Slug(), Query()), function* (row) {
    const slug = asText(row.get(Slug).value(), "");
    const listed = matching(asText(row.get(Query).value(), "")).some(
      entry => "/" + entry.slug === slug,
    );
    yield* row
      .get(Element.A)
      .get(Style.Display)
      .pipe(Token.setValue(either(listed, "flex", "none")));
  })
  .rule(SearchEmpty(Query()), function* (empty) {
    const none = matching(asText(empty.get(Query).value(), "")).length === 0;
    yield* empty
      .get(Element.P)
      .get(Style.Display)
      .pipe(Token.setValue(either(none, "block", "none")));
  })
  .rule(Sheet(), function* (sheet) {
    const open = sheet.get(Open);
    const query = sheet.get(Query);
    const header = inner(panelOfSheet(sheet).get(SheetHeader), Element.Div);
    yield* header
      .get(SheetInput)
      .get(Element.Input)
      .pipe(Token.add(Event.OnInput(event => query.pipe(Token.setValue(inputText(event, ""))))));
    yield* header
      .get(SheetInput)
      .get(Element.Input)
      .pipe(Token.add(Event.OnKeydown(closeOnEnter(open, query))));
    yield* header
      .get(SheetClose)
      .get(Element.Button)
      .pipe(Token.add(Event.OnClick(() => open.pipe(Token.setValue(false)))));
    yield* inner(sheet, Element.Div).pipe(Token.add(Event.OnClick(closeOnBackdrop(open))));
  })
  // Image outlines: one line at 10%, inside the image, per theme.
  .rule(OutlineDemo(), function* (demo) {
    const outlined = demo.get(Outlined);
    const strength = demo.get(OutlineStrength);
    const chips = frameOf(demo).get(Controls).get(Element.Div).all(Chip);
    for (const chip of chips) {
      yield* chip.get(Element.Button).pipe(
        Token.add(
          Event.OnClick(() => {
            const choice = asText(chip.get(OutlineChoice).value(), "");
            return Effect.gen(function* () {
              yield* outlined.pipe(Token.setValue(choice === "on"));
              for (const other of chips) {
                yield* other
                  .get(Selected)
                  .pipe(Token.setValue(asText(other.get(OutlineChoice).value(), "") === choice));
              }
            });
          }),
        ),
      );
    }
    yield* frameOf(demo)
      .get(ReadoutRow)
      .get(Element.Div)
      .get(OutlineStrengthInput)
      .get(Element.Input)
      .pipe(
        Token.add(Event.OnInput(event => strength.pipe(Token.setValue(inputNumber(event, 10))))),
      );
  })
  .rule(OutlineDemo(Outlined(), OutlineStrength()), function* (demo) {
    const outlined = isOn(demo.get(Outlined).value());
    const strength = asNumber(demo.get(OutlineStrength).value(), 10);
    const section = frameOf(demo);
    for (const image of section.get(Photos).get(Element.Div).all(Element.Img)) {
      yield* image
        .get(Style.Outline)
        .pipe(Token.setValue(either(outlined, "1px solid " + tint(strength), "none")));
    }
    yield* section
      .get(ReadoutRow)
      .get(Element.Div)
      .get(OutlineReadout)
      .pipe(Token.setValue(strength + "%"));
  })
  // Nested radius: the inner corner is the outer corner minus the gap.
  .rule(NestedDemo(), function* (demo) {
    const outer = demo.get(OuterRadius);
    const padding = demo.get(InnerPadding);
    const controls = frameOf(demo).get(Controls).get(Element.Div);
    yield* controls
      .get(OuterInput)
      .get(Element.Input)
      .pipe(Token.add(Event.OnInput(event => outer.pipe(Token.setValue(inputNumber(event, 28))))));
    yield* controls
      .get(PaddingInput)
      .get(Element.Input)
      .pipe(Token.add(Event.OnInput(event => padding.pipe(Token.setValue(inputNumber(event, 8))))));
  })
  .rule(NestedDemo(OuterRadius(), InnerPadding()), function* (demo) {
    const outer = asNumber(demo.get(OuterRadius).value(), 28);
    const padding = asNumber(demo.get(InnerPadding).value(), 12);
    const corner = Math.max(0, outer - padding);
    const stage = frameOf(demo).get(Stage).get(Element.Div);
    yield* stage.get(Style.Padding).pipe(Token.setValue(padding + "px"));
    yield* stage.get(Style.BorderRadius).pipe(Token.setValue(outer + "px"));
    yield* inner(stage, Element.Div)
      .get(Style.BorderRadius)
      .pipe(Token.setValue(corner + "px"));
    yield* frameOf(demo)
      .get(ReadoutRow)
      .get(Element.Div)
      .get(NestedReadout)
      .pipe(Token.setValue(outer + " − " + padding + " = " + corner + "px inner"));
  })
  // Tabular numbers: every digit is the same width, so nothing beside it moves.
  .rule(NumericDemo(), function* (demo) {
    const reading = demo.get(Reading);
    yield* frameOf(demo)
      .get(Controls)
      .get(Element.Div)
      .get(Control)
      .get(Element.Button)
      .pipe(
        Token.add(
          Event.OnClick(() => {
            const readings = [1111, 8888, 3333, 12345, 7777];
            const index = readings.indexOf(asNumber(reading.value(), 1111));
            const next = readings[(index + 1) % readings.length] ?? 1111;
            return reading.pipe(Token.setValue(next));
          }),
        ),
      );
  })
  .rule(NumericDemo(Reading()), function* (demo) {
    const formatted = asNumber(demo.get(Reading).value(), 1111).toLocaleString("en-US");
    const numbers = frameOf(demo).get(Numbers).get(Element.Div);
    yield* inner(numbers.get(ProportionalColumn), Element.Div)
      .get(Element.Span)
      .get(ProportionalValue)
      .pipe(Token.setValue(formatted));
    yield* inner(numbers.get(TabularColumn), Element.Div)
      .get(Element.Span)
      .get(TabularValue)
      .pipe(Token.setValue(formatted));
  })
  // Interruptibility: a new transition starts from wherever the value is now.
  .rule(RevealDemo(), function* (demo) {
    const revealed = demo.get(Revealed);
    yield* frameOf(demo)
      .get(Controls)
      .get(Element.Div)
      .get(Control)
      .get(Element.Button)
      .pipe(Token.add(Event.OnClick(() => revealed.pipe(Token.setValue(!isOn(revealed.value()))))));
  })
  .rule(RevealDemo(Revealed()), function* (demo) {
    yield* inner(frameOf(demo).get(Stage).get(Element.Div), Element.Div)
      .get(Style.Transform)
      .pipe(
        Token.setValue(
          either(isOn(demo.get(Revealed).value()), "translateX(64px)", "translateX(-64px)"),
        ),
      );
  });

function initialRoute(): string {
  const hash = globalThis.location.hash.slice(1);
  return either(hash === "", "/", hash);
}

function prefersDark(): boolean {
  return globalThis.matchMedia("(prefers-color-scheme: dark)").matches;
}

function isNarrow(): boolean {
  return globalThis.matchMedia("(max-width: 860px)").matches;
}
