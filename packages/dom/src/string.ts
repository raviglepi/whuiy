/** @since 0.4.0 */

import type {LiveToken, TokenRoot} from "whuiy";

import {Effect, Schema} from "effect";

import {getDecoratorMetadata, getElementMetadata} from "whuiy/primitives";
import {Whuiy} from "whuiy";

const VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "source",
  "track",
  "wbr",
]);

const TextValue = Schema.Union([Schema.String, Schema.Finite]);

interface Parts {
  readonly body: string;
  readonly styles: readonly string[];
}

function escapeText(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function kebabCase(property: string): string {
  const dashed = property.replaceAll(/[A-Z]/g, letter => "-" + letter.toLowerCase());
  const vendor = ["webkit-", "moz-", "ms-", "o-"].find(prefix => dashed.startsWith(prefix));
  return vendor === undefined ? dashed : "-" + dashed;
}

function declaration(token: LiveToken, property: string): string {
  const value = token.value();
  if (!Schema.is(TextValue)(value)) return "";
  return `${kebabCase(property)}:${String(value)}`;
}

function textOf(token: LiveToken): string {
  const value = token.value();
  return Schema.is(TextValue)(value) ? escapeText(String(value)) : "";
}

function renderElement(token: LiveToken, tag: string, children: readonly LiveToken[]): string {
  const {body, styles} = parts(children);
  const attribute = styles.length === 0 ? "" : ` style="${escapeText(styles.join(";"))}"`;
  const open = `<${tag}${attribute}>`;
  return VOID_TAGS.has(tag) ? open : `${open}${body}</${tag}>`;
}

function serialize(token: LiveToken): string {
  const element = getElementMetadata(token.definition);
  if (element !== undefined) return renderElement(token, element.tag, token.tokens());
  const text = textOf(token);
  return text.length > 0 ? text : parts(token.tokens()).body;
}

function isEvent(token: LiveToken): boolean {
  return getDecoratorMetadata(token.definition)?.kind === "event";
}

function styleOf(token: LiveToken): string {
  const decorator = getDecoratorMetadata(token.definition);
  return decorator?.kind === "style" ? declaration(token, decorator.property) : "";
}

function collect(styles: string[], body: string[], token: LiveToken): void {
  if (isEvent(token)) return;
  const style = styleOf(token);
  if (style.length > 0) styles.push(style);
  else body.push(serialize(token));
}

function parts(tokens: readonly LiveToken[]): Parts {
  const styles: string[] = [];
  const body: string[] = [];
  for (const token of tokens) collect(styles, body, token);
  return {body: body.join(""), styles: styles.filter(style => style.length > 0)};
}

/**
 * Renders a described tree to HTML after running its rules to a fixed point.
 *
 * **When to use**
 *
 * Call this inside `comptime(() => ...)` to ship markup instead of a runtime.
 * The function is synchronous, so it belongs in build steps and tests, not in
 * render loops.
 *
 * @since 0.4.0
 * @category Destructors
 */
export function renderToString(whuiy: Whuiy, ...roots: readonly TokenRoot[]): string {
  const runtime = Effect.runSync(whuiy.make());
  const mounted = Effect.runSync(runtime.mount(...roots));
  const html = parts(mounted.roots).body;
  Effect.runSync(mounted.release);
  return html;
}
