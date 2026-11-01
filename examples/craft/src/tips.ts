/** @since 0.4.0 */

import {Effect} from "effect";

import {Element, Event, Style, Token, Whuiy} from "whuiy";
import {lift, tint} from "./design.ts";
import {asNumber, either, inner, isOn} from "./facts.ts";
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
  Tightened,
  Tinted,
} from "./tokens.ts";

/** The nudges are per glyph; a circle, triangle, and star do not share a centre. */
const glyphNudges = new Map([
  ["arrow", "translateY(1px)"],
  ["play", "translateX(1px)"],
  ["star", "translateY(-1px)"],
]);

/** Fade only the edge that has more to show. */
const fadeMask = (above: boolean, below: boolean): string => {
  const stops =
    either(above, "transparent, black 16%", "black 0%") +
    ", " +
    either(below, "black 84%, transparent", "black 100%");
  return either(above || below, "linear-gradient(to bottom, " + stops + ")", "none");
};

const CURSOR = "cubic-bezier(0.32, 0.72, 0, 1)";

/**
 * Every rule here encodes one Craft tip. A marker token wraps the element the
 * rule styles; the facts the rule reads are that element's children, so the
 * condition names exactly what the body uses.
 *
 * @since 0.4.0
 */
export const tipRules = (ui: Whuiy) =>
  ui
    // Nested Border Radius: the inner corner is the outer corner minus the gap.
    .rule(NestedBox(Outer(), Padding()), function* (box) {
      const outer = asNumber(box.get(Outer).value(), 28);
      const padding = asNumber(box.get(Padding).value(), 12);
      const corner = Math.max(0, outer - padding);
      const frame = inner(box, Element.Div);
      yield* frame.get(Style.Padding).pipe(Token.setValue(padding + "px"));
      yield* frame.get(Style.BorderRadius).pipe(Token.setValue(outer + "px"));
      yield* frame
        .get(InnerBox)
        .pipe(node => inner(node, Element.Div))
        .get(Style.BorderRadius)
        .pipe(Token.setValue(corner + "px"));
    })
    // Tabular Numbers: steady digits for values that change.
    .rule(Metric(Reading(), Steady()), function* (metric) {
      const reading = asNumber(metric.get(Reading).value(), 1111);
      const steady = isOn(metric.get(Steady).value());
      const value = metric.get(Element.Span);
      yield* value.get(ReadingText).pipe(Token.setValue(reading.toLocaleString("en-US")));
      yield* value
        .get(Style.FontVariantNumeric)
        .pipe(Token.setValue(either(steady, "tabular-nums", "proportional-nums")));
    })
    // The counter's button is wiring, not a value: it runs once.
    .rule(Metric(), function* (metric) {
      const reading = metric.get(Reading);
      yield* metric
        .get(AdvanceStep)
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
    // Letter Spacing: tighten big text, loosen small text.
    .rule(Tightened(Size()), function* (mark) {
      const size = asNumber(mark.get(Size).value(), 24);
      const spacing = either(size >= 24, "-0.03em", "0.01em");
      yield* mark.get(Element.H1).get(Style.LetterSpacing).pipe(Token.setValue(spacing));
    })
    // Text Wrapping: balanced headings, no lonely last words.
    .rule(Balanced(), function* (mark) {
      yield* mark.get(Element.H2).get(Style.TextWrap).pipe(Token.setValue("balance"));
    })
    // Optical Alignment: center for the eye, then keep the nudge.
    .rule(Optical(Glyph()), function* (mark) {
      const glyph = mark.get(Glyph).value() ?? "";
      yield* mark
        .get(Element.Span)
        .get(Style.Transform)
        .pipe(Token.setValue(glyphNudges.get(glyph) ?? "none"));
    })
    // Image Outlines: a faint inner edge that frames images.
    .rule(Framed(), function* (mark) {
      const image = mark.get(Element.Img);
      yield* image.get(Style.Outline).pipe(Token.setValue("1px solid " + tint(10)));
      yield* image.get(Style.OutlineOffset).pipe(Token.setValue("-1px"));
    })
    // Shadows, Not Borders: layered shadows give edge and depth.
    .rule(Edged(), function* (mark) {
      const surface = inner(mark, Element.Div);
      yield* surface.get(Style.Border).pipe(Token.setValue("none"));
      yield* surface.get(Style.BoxShadow).pipe(Token.setValue(lift));
    })
    // Hit Areas: make the target bigger than the icon.
    .rule(Target(), function* (mark) {
      const control = mark.get(Element.Button);
      yield* control.get(Style.Width).pipe(Token.setValue("44px"));
      yield* control.get(Style.Height).pipe(Token.setValue("44px"));
      yield* control.get(Style.MinWidth).pipe(Token.setValue("44px"));
      yield* control.get(Style.MinHeight).pipe(Token.setValue("44px"));
      yield* control.get(Style.Padding).pipe(Token.setValue("9px"));
      yield* control.get(Style.Margin).pipe(Token.setValue("-9px"));
    })
    // Button Press: scale down on press so it feels real.
    .rule(Element.Button(PressProbe()), function* (button) {
      const pressed = button.get(Pressable).get(Pressed);
      yield* button.pipe(
        Token.add(
          Event.OnPointerdown(() => pressed.pipe(Token.setValue(true))),
          Event.OnPointerup(() => pressed.pipe(Token.setValue(false))),
          Event.OnPointerleave(() => pressed.pipe(Token.setValue(false))),
        ),
      );
    })
    .rule(Pressable(Pressed()), function* (mark) {
      const pressed = isOn(mark.get(Pressed).value());
      yield* mark
        .get(Element.Button)
        .get(Style.Transform)
        .pipe(Token.setValue(either(pressed, "scale(0.97)", "none")));
    })
    // Hover Restraint: tint the surface, leave the layout alone.
    .rule(Element.A(HoverProbe()), function* (link) {
      const hovered = link.get(Tinted).get(Hovered);
      yield* link.pipe(
        Token.add(
          Event.OnPointerenter(() => hovered.pipe(Token.setValue(true))),
          Event.OnPointerleave(() => hovered.pipe(Token.setValue(false))),
        ),
      );
    })
    .rule(Tinted(Hovered(), Element.A()), function* (mark) {
      const lit = isOn(mark.get(Hovered).value());
      yield* mark
        .get(Element.A)
        .get(Style.BoxShadow)
        .pipe(Token.setValue(either(lit, "inset 0 0 0 999px " + tint(6), "none")));
    })
    // Scroll Fades: fade the edge that has more to scroll.
    .rule(Element.Div(ScrollProbe()), function* (div) {
      const region = div.get(Faded);
      const above = region.get(MoreAbove);
      const below = region.get(MoreBelow);
      yield* div.pipe(
        Token.add(
          Event.OnScroll(event => {
            const target = event.currentTarget;
            if (!(target instanceof HTMLElement)) return Effect.void;
            const more = target.scrollTop + target.clientHeight < target.scrollHeight - 1;
            return Effect.all(
              [above.pipe(Token.setValue(target.scrollTop > 1)), below.pipe(Token.setValue(more))],
              {discard: true},
            );
          }),
        ),
      );
    })
    .rule(Faded(MoreAbove(), MoreBelow()), function* (region) {
      const above = isOn(region.get(MoreAbove).value());
      const below = isOn(region.get(MoreBelow).value());
      yield* inner(region, Element.Div)
        .get(Style.MaskImage)
        .pipe(Token.setValue(fadeMask(above, below)));
    })
    // Interruptibility: a reversal is a new transition from the current value.
    .rule(Sliding(), function* (demo) {
      const moved = demo.get(Moved);
      yield* demo
        .get(Step)
        .get(Element.Button)
        .pipe(Token.add(Event.OnClick(() => moved.pipe(Token.setValue(!isOn(moved.value()))))));
    })
    .rule(Sliding(Moved(), Smooth()), function* (demo) {
      const moved = isOn(demo.get(Moved).value());
      const smooth = isOn(demo.get(Smooth).value());
      const mover = inner(inner(demo, Element.Div).get(Mover), Element.Div);
      yield* mover
        .get(Style.Transform)
        .pipe(Token.setValue(either(moved, "translateX(64px)", "translateX(-64px)")));
      yield* mover
        .get(Style.Transition)
        .pipe(Token.setValue(either(smooth, "transform 420ms " + CURSOR, "none")));
    });
