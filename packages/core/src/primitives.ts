import type {PascalCase} from "type-fest";
import type {PropertyTypes} from "./generated/platform.ts";
import type {TokenDefinition, TokenDefinitionRef} from "./token.ts";

import {Effect} from "effect";

import {elementTags, eventTypes, propertyNames, styleProperties} from "./generated/platform.ts";
import {contentDefinitions, Token} from "./token.ts";

/** @since 0.4.0 */
export type StyleProperty = Exclude<
  Extract<keyof CSSStyleProperties, string>,
  keyof CSSStyleDeclarationBase
>;
/**
 * Event-property names that Whuiy adapters dispatch from rendered HTMLElement nodes.
 * They do not represent events on Document or Window.
 *
 * @since 0.4.0
 */
export type EventProperty = `on${Capitalize<Extract<keyof HTMLElementEventMap, string>>}`;
/** @internal @since 0.4.0 */
export type ElementProperty = Extract<keyof HTMLElementTagNameMap, string>;

/**
 * Writable platform properties that carry a primitive value.
 *
 * @since 0.4.0
 */
export type PropertyName = keyof PropertyTypes;

type PropertyValueType<Type> = Type extends "boolean"
  ? boolean
  : Type extends "number"
    ? number
    : string;

/** @since 0.4.0 */
export type PropertyValue<Property extends PropertyName> = PropertyValueType<
  PropertyTypes[Property]
>;
/** @since 0.4.0 */
export type PropertyToken<Property extends PropertyName> = TokenDefinition<
  PascalCase<Property>,
  PropertyValue<Property>
>;
/** @since 0.4.0 */
export type PropertyFamily = {
  readonly [Property in PropertyName as PascalCase<Property>]: PropertyToken<Property>;
};

type EventName<Property extends EventProperty> = Property extends `on${infer Name}`
  ? Uncapitalize<Name> & keyof HTMLElementEventMap
  : never;
type EventHandler<Property extends EventProperty> = (
  event: HTMLElementEventMap[EventName<Property>],
) => Effect.Effect<void>;

/** @since 0.4.0 */
export type StyleToken<Property extends StyleProperty> = TokenDefinition<
  PascalCase<Property>,
  string | number
>;
/** @since 0.4.0 */
export type EventToken<Property extends EventProperty> = TokenDefinition<
  PascalCase<Property>,
  EventHandler<Property>
>;
/** @since 0.4.0 */
export type ElementToken<Property extends ElementProperty> = TokenDefinition<PascalCase<Property>>;

/** @since 0.4.0 */
export type StyleFamily = {
  readonly [Property in StyleProperty as PascalCase<Property>]: StyleToken<Property>;
};
/** @since 0.4.0 */
export type EventFamily = {
  readonly [Property in EventProperty as PascalCase<Property>]: EventToken<Property>;
};
/** @since 0.4.0 */
export type ElementFamily = {
  readonly [Property in ElementProperty as PascalCase<Property>]: ElementToken<Property>;
};

/** @internal */
export type DecoratorMetadata =
  | {readonly definition: TokenDefinitionRef; readonly kind: "event"; readonly property: string}
  | {readonly definition: TokenDefinitionRef; readonly kind: "property"; readonly property: string}
  | {readonly definition: TokenDefinitionRef; readonly kind: "style"; readonly property: string};
/** @internal */
export interface ElementMetadata {
  readonly definition: TokenDefinitionRef;
  readonly kind: "element";
  readonly tag: string;
}
/** @internal */
export type PrimitiveMetadata = DecoratorMetadata | ElementMetadata;

const styleDescriptors = styleProperties.map(name => ({name}));
const eventDescriptors = eventTypes.map(name => ({
  name: "on" + name.charAt(0).toUpperCase() + name.slice(1),
}));
const elementDescriptors = elementTags.map(name => ({name}));
const propertyDescriptors = propertyNames.map(name => ({name}));

const metadataMap = new WeakMap<TokenDefinitionRef, PrimitiveMetadata>();

function definitionName(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

type Descriptor = {readonly name: string};
type TokenEntry = {readonly definition: TokenDefinitionRef; readonly metadata: PrimitiveMetadata};

function createDecoratorEntries(
  kind: DecoratorMetadata["kind"],
  descriptors: readonly Descriptor[],
): readonly TokenEntry[] {
  return descriptors.map(descriptor => {
    const definition = Token(definitionName(descriptor.name)).single();
    const metadata: DecoratorMetadata = {definition, kind, property: descriptor.name};
    metadataMap.set(definition, metadata);
    return {definition, metadata};
  });
}

function createElementEntries(descriptors: readonly Descriptor[]): readonly TokenEntry[] {
  return descriptors.map(descriptor => {
    const definition = Token(definitionName(descriptor.name))();
    const metadata: ElementMetadata = {definition, kind: "element", tag: descriptor.name};
    metadataMap.set(definition, metadata);
    return {definition, metadata};
  });
}

function createFamily<Family>(entries: readonly TokenEntry[]): Family {
  // SAFETY: each generated key is the PascalCase name of its matching token definition.
  return Object.fromEntries(
    entries.map(entry => [entry.definition.name, entry.definition]),
  ) as Family;
}

/** @since 0.4.0 */
export const Style = createFamily<StyleFamily>(createDecoratorEntries("style", styleDescriptors));
/** @since 0.4.0 */
export const Event = createFamily<EventFamily>(createDecoratorEntries("event", eventDescriptors));
/** @since 0.4.0 */
export const Element = createFamily<ElementFamily>(createElementEntries(elementDescriptors));
/** @since 0.4.0 */
export const Property = createFamily<PropertyFamily>(
  createDecoratorEntries("property", propertyDescriptors),
);

/** @internal @since 0.4.0 */
export function isContentDefinition(value: TokenDefinitionRef): boolean {
  return contentDefinitions.has(Object(value));
}

/** @internal @since 0.4.0 */
export function getDecoratorMetadata(
  definition: TokenDefinitionRef,
): DecoratorMetadata | undefined {
  const entry = metadataMap.get(definition);
  return entry?.kind === "element" ? undefined : entry;
}

/** @internal @since 0.4.0 */
export function getElementMetadata(definition: TokenDefinitionRef): ElementMetadata | undefined {
  const entry = metadataMap.get(definition);
  return entry?.kind === "element" ? entry : undefined;
}
