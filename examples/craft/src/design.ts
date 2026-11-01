/** @since 0.4.0 */

/** A colour that resolves against the page's current `color-scheme`. */
const pair = (light: string, dark: string): string => `light-dark(${light}, ${dark})`;

/** The palette. One `color-scheme` fact flips every pair at once. */
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

export const sans =
  'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
export const mono = 'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace';

export const radius = {card: "10px", control: "7px", panel: "12px", pill: "999px"} as const;

/** A tint that follows the element's own ink, so it works in both palettes. */
export const tint = (percent: number): string =>
  `color-mix(in srgb, currentColor ${percent}%, transparent)`;

/** The site's edge: a hairline, a lift, and a soft floor. */
export const lift =
  "0 0 0 1px light-dark(rgb(0 0 0 / 5%), rgb(255 255 255 / 6%)), 0 1px 2px -1px light-dark(rgb(0 0 0 / 6%), rgb(0 0 0 / 50%)), 0 2px 4px 0 light-dark(rgb(0 0 0 / 4%), rgb(0 0 0 / 35%))";
