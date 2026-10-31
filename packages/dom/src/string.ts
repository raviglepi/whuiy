/** @since 0.4.0 */

import type {LiveToken, RuleFailure, TokenRoot, TokenValue} from "whuiy";

import {Cause, Effect, Schema} from "effect";

import {getDecoratorMetadata, getElementMetadata, isContentDefinition} from "whuiy/primitives";
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

/** Property names whose HTML attribute spelling differs from the DOM property. */
const ATTRIBUTE_NAMES = new Map<string, string>([
  ["className", "class"],
  ["defaultChecked", "checked"],
  ["defaultValue", "value"],
  ["htmlFor", "for"],
]);

interface Parts {
  readonly attributes: readonly string[];
  readonly body: string;
  readonly styles: readonly string[];
}

interface Draft {
  readonly attributes: string[];
  readonly body: string[];
  readonly styles: string[];
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

function openTag(tag: string, styles: readonly string[], attributes: readonly string[]): string {
  const style = styles.length === 0 ? "" : ` style="${escapeText(styles.join(";"))}"`;
  const rest = attributes.length === 0 ? "" : ` ${attributes.join(" ")}`;
  return `<${tag}${style}${rest}>`;
}

function renderElement(token: LiveToken, tag: string, children: readonly LiveToken[]): string {
  const {attributes, body, styles} = parts(children);
  return VOID_TAGS.has(tag)
    ? openTag(tag, styles, attributes)
    : `${openTag(tag, styles, attributes)}${body}</${tag}>`;
}

function serialize(token: LiveToken): string {
  const element = getElementMetadata(token.definition);
  if (element !== undefined) return renderElement(token, element.tag, token.tokens());
  if (isContentDefinition(token.definition)) return textOf(token);
  return parts(token.tokens()).body;
}

function isEvent(token: LiveToken): boolean {
  return getDecoratorMetadata(token.definition)?.kind === "event";
}

function styleOf(token: LiveToken): string {
  const decorator = getDecoratorMetadata(token.definition);
  return decorator?.kind === "style" ? declaration(token, decorator.property) : "";
}

function attributeName(property: string): string {
  return ATTRIBUTE_NAMES.get(property) ?? property.toLowerCase();
}

function isOmitted(value: TokenValue): boolean {
  return value === false || value === undefined || value === null;
}

function attributeText(property: string, value: TokenValue): string {
  if (isOmitted(value)) return "";
  if (value === true) return attributeName(property);
  return `${attributeName(property)}="${escapeText(String(value))}"`;
}

function attributeOf(token: LiveToken): string {
  const decorator = getDecoratorMetadata(token.definition);
  if (decorator?.kind !== "property") return "";
  return attributeText(decorator.property, token.value());
}

function collectDecorator(draft: Draft, token: LiveToken): void {
  const attribute = attributeOf(token);
  if (attribute.length > 0) {
    draft.attributes.push(attribute);
    return;
  }
  const style = styleOf(token);
  if (style.length > 0) {
    draft.styles.push(style);
    return;
  }
  draft.body.push(serialize(token));
}

function collect(draft: Draft, token: LiveToken): void {
  if (isEvent(token)) return;
  collectDecorator(draft, token);
}

function parts(tokens: readonly LiveToken[]): Parts {
  const draft: Draft = {attributes: [], body: [], styles: []};
  for (const token of tokens) collect(draft, token);
  return {
    attributes: draft.attributes.filter(attribute => attribute.length > 0),
    body: draft.body.join(""),
    styles: draft.styles.filter(style => style.length > 0),
  };
}

/**
 * Renders a described tree to HTML after running its rules to a fixed point.
 *
 * **When to use**
 *
 * Call this inside `comptime(() => ...)` to ship markup instead of a runtime.
 * The function is synchronous, so it belongs in build steps and tests, not in
 * render loops. A rule that fails while rendering throws, so a broken
 * description cannot silently ship wrong markup.
 *
 * @since 0.4.0
 * @category Destructors
 */
export function renderToString(whuiy: Whuiy, ...roots: readonly TokenRoot[]): string {
  const runtime = Effect.runSync(whuiy.make());
  const failures: RuleFailure[] = [];
  const unsubscribe = runtime.subscribeFailures(failure => failures.push(failure));
  const mounted = Effect.runSync(runtime.mount(...roots));
  const html = parts(mounted.roots).body;
  Effect.runSync(mounted.release);
  unsubscribe();
  if (failures[0] !== undefined) throw ruleFailureError(failures[0]);
  return html;
}

function ruleFailureError(failure: RuleFailure): Error {
  return new Error(
    `Rule ${failure.rule} failed while rendering to HTML: ${Cause.pretty(failure.cause)}`,
  );
}
