/** @since 0.4.0 */

import type {Chapter} from "./content.ts";

/** A colour that resolves against the page's current `color-scheme`. */
const pair = (light: string, dark: string): string => `light-dark(${light}, ${dark})`;

/**
 * The palette. Each colour carries both values, so a theme change is one fact
 * on the root element and every surface follows without being rewritten.
 */
export const tone = {
  background: pair("#fafafa", "#0f0f0f"),
  body: pair("#525252", "#a3a3a3"),
  card: pair("#ffffff", "#171717"),
  faint: pair("#a3a3a3", "#6b6b6b"),
  hairline: pair("#e8e8e8", "#242424"),
  ink: pair("#171717", "#ededed"),
  muted: pair("#737373", "#8b8b8b"),
  strong: pair("#d4d4d4", "#333333"),
  wash: pair("#f2f2f2", "#1f1f1f"),
} as const;

/** A chapter hue in both themes, so the accent is a fact too. */
const hue = (light: string, dark: string) => ({dark, light});

const chapterHues: Record<Chapter, {readonly dark: string; readonly light: string}> = {
  Color: hue("#be123c", "#fb7185"),
  Craft: hue("#b45309", "#f59e0b"),
  Data: hue("#0e7490", "#22d3ee"),
  Layout: hue("#a16207", "#facc15"),
  Motion: hue("#15803d", "#4ade80"),
  Sound: hue("#6d28d9", "#a78bfa"),
  Typography: hue("#1d4ed8", "#60a5fa"),
};

/** A chapter's colour, defaulting to the page ink when there is no chapter. */
export const hueFor = (chapter: Chapter | undefined): string => {
  if (chapter === undefined) return tone.ink;
  const value = chapterHues[chapter];
  return pair(value.light, value.dark);
};

/** One family, one weight, sized to the text. */
export const sans =
  'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
export const mono = 'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace';

export const radius = {card: "10px", control: "7px", demo: "12px", pill: "999px"} as const;

/** The one shadow the site uses: an edge, a hairline lift, and a soft floor. */
export const lift =
  "0 0 0 1px light-dark(rgb(0 0 0 / 5%), rgb(255 255 255 / 6%)), 0 1px 2px -1px light-dark(rgb(0 0 0 / 6%), rgb(0 0 0 / 50%)), 0 2px 4px 0 light-dark(rgb(0 0 0 / 4%), rgb(0 0 0 / 35%))";

/** A surface tint that works on either colour scheme. */
export const tint = (percent: number): string =>
  `color-mix(in srgb, currentColor ${percent}%, transparent)`;
