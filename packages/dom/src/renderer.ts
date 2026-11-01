/** @since 0.4.0 */

import type {DecoratorMetadata} from "whuiy/primitives";
import type {GraphChange, LiveToken, Mount, TokenRoot, TokenValue, WhuiyRuntime} from "whuiy";
import type {ErrorReporter} from "./errors.ts";

import {Cause, Effect, Exit, Predicate, Schema} from "effect";

import {getDecoratorMetadata, getElementMetadata, isContentDefinition} from "whuiy/primitives";
import {ProjectionError} from "./errors.ts";

type Handler = (event: Event) => Effect.Effect<void>;

type ElementEntry = {
  readonly childIds: ReadonlySet<number>;
  readonly element: HTMLElement;
  readonly kind: "element";
};
type Entry = ElementEntry | {readonly kind: "text"; readonly node: Text};

interface DecoratorOwner {
  readonly element: HTMLElement;
  readonly kind: "property" | "style";
  readonly property: string;
}

interface Context {
  readonly containers: Set<number>;
  readonly document: Document;
  readonly entries: Map<number, Entry>;
  readonly known: Set<number>;
  readonly owners: Map<number, DecoratorOwner>;
  readonly reportError: ErrorReporter;
}

const StyleValue = Schema.Union([Schema.String, Schema.Finite]);

/** @since 0.4.0 */
export interface DomRendererOptions {
  readonly reportError: ErrorReporter;
  readonly runtime: WhuiyRuntime;
}
/** @since 0.4.0 */
export interface DomRender {
  dispose(): void;
  /** The mount this render owns, for callers that write facts after boot. */
  readonly mount: Mount;
}
/** @since 0.4.0 */
export interface DomRenderer {
  render(parent: HTMLElement, ...roots: readonly TokenRoot[]): DomRender;
}

function kebabCase(property: string): string {
  const dashed = property.replaceAll(/[A-Z]/g, letter => "-" + letter.toLowerCase());
  const vendor = ["webkit-", "moz-", "ms-", "o-"].find(prefix => dashed.startsWith(prefix));
  return vendor === undefined ? dashed : "-" + dashed;
}

function styleText(value: TokenValue): string | undefined {
  return Schema.is(StyleValue)(value) ? String(value) : undefined;
}

function textOf(token: LiveToken): string {
  const value = token.value();
  return Schema.is(StyleValue)(value) ? String(value) : "";
}

function applyStyle(token: LiveToken, element: HTMLElement, property: string): void {
  const value = styleText(token.value());
  const name = kebabCase(property);
  if (value === undefined) element.style.removeProperty(name);
  else element.style.setProperty(name, value);
}

function applyProperty(token: LiveToken, element: HTMLElement, property: string): void {
  Reflect.set(element, property, token.value());
}

function eventType(property: string): string {
  return property.slice(2).toLowerCase();
}

function attachListener(
  token: LiveToken,
  element: HTMLElement,
  property: string,
  ctx: Context,
): void {
  const handler = token.value();
  if (!Predicate.isFunction(handler)) return;
  // SAFETY: Predicate.isFunction narrows `handler` to callable, and Event tokens
  // are declared as Event handlers by the primitive factory.
  const effect = handler as Handler;
  const listener = (event: Event): void => {
    const result = Effect.runSyncExit(effect(event));
    if (Exit.isFailure(result)) report({ctx, error: projectionError(result.cause)});
  };
  element.addEventListener(eventType(property), listener);
}

function isDecorator(token: LiveToken): boolean {
  return getDecoratorMetadata(token.definition) !== undefined;
}

function decorate(token: LiveToken, element: HTMLElement, ctx: Context): void {
  const decorator = getDecoratorMetadata(token.definition);
  if (decorator === undefined) return;
  ctx.known.add(token.id);
  decorateKind({ctx, decorator, element, token});
}

function decorateKind(options: {
  readonly ctx: Context;
  readonly decorator: DecoratorMetadata;
  readonly element: HTMLElement;
  readonly token: LiveToken;
}): void {
  const {ctx, decorator, element, token} = options;
  if (decorator.kind === "event") {
    attachListener(token, element, decorator.property, ctx);
    return;
  }
  if (decorator.kind === "property") {
    applyProperty(token, element, decorator.property);
    ctx.owners.set(token.id, {element, kind: "property", property: decorator.property});
    return;
  }
  applyStyle(token, element, decorator.property);
  ctx.owners.set(token.id, {element, kind: "style", property: decorator.property});
}

function decorateChildren(token: LiveToken, element: HTMLElement, ctx: Context): void {
  for (const child of token.tokens()) decorate(child, element, ctx);
}

function appendChildren(token: LiveToken, element: HTMLElement, ctx: Context): void {
  for (const child of token.tokens())
    if (!isDecorator(child)) element.append(...project(child, ctx));
}

function projectElement(token: LiveToken, tag: string, ctx: Context): HTMLElement {
  const element = ctx.document.createElement(tag);
  decorateChildren(token, element, ctx);
  appendChildren(token, element, ctx);
  ctx.entries.set(token.id, {childIds: contentIds(token), element, kind: "element"});
  return element;
}

function contentIds(token: LiveToken): ReadonlySet<number> {
  return new Set(
    token
      .tokens()
      .filter(child => !isDecorator(child))
      .map(child => child.id),
  );
}

function projectText(token: LiveToken, ctx: Context): readonly Node[] {
  const value = token.value();
  const node = ctx.document.createTextNode(Schema.is(StyleValue)(value) ? String(value) : "");
  ctx.entries.set(token.id, {kind: "text", node});
  return [node];
}

function projectContainer(token: LiveToken, ctx: Context): readonly Node[] {
  if (token.tokens().length > 0) ctx.containers.add(token.id);
  return token.tokens().flatMap(child => project(child, ctx));
}

function project(token: LiveToken, ctx: Context): readonly Node[] {
  ctx.known.add(token.id);
  const element = getElementMetadata(token.definition);
  if (element !== undefined) return [projectElement(token, element.tag, ctx)];
  if (isContentDefinition(token.definition)) return projectText(token, ctx);
  return projectContainer(token, ctx);
}

function applyStylesOf(token: LiveToken, element: HTMLElement, ctx: Context): void {
  for (const child of token.tokens()) decorate(child, element, ctx);
}

function sameChildIds(token: LiveToken, expected: ReadonlySet<number>): boolean {
  const ids = [...contentIds(token)];
  return ids.length === expected.size && ids.every(id => expected.has(id));
}

function patchElement(token: LiveToken, entry: ElementEntry, ctx: Context): boolean {
  if (!sameChildIds(token, entry.childIds)) return false;
  applyStylesOf(token, entry.element, ctx);
  return true;
}

function patchEntry(token: LiveToken, entry: Entry, ctx: Context): boolean {
  if (entry.kind === "text") {
    entry.node.data = textOf(token);
    return true;
  }
  return patchElement(token, entry, ctx);
}

function patchOwner(token: LiveToken, owner: DecoratorOwner): void {
  if (owner.kind === "property") {
    applyProperty(token, owner.element, owner.property);
    return;
  }
  applyStyle(token, owner.element, owner.property);
}

function patchKnown(token: LiveToken, ctx: Context): boolean {
  const owner = ctx.owners.get(token.id);
  if (owner !== undefined) {
    patchOwner(token, owner);
    return true;
  }
  const entry = ctx.entries.get(token.id);
  if (entry === undefined) return true;
  return patchEntry(token, entry, ctx);
}

function patch(token: LiveToken, ctx: Context): boolean {
  if (!ctx.known.has(token.id)) return false;
  if (ctx.containers.has(token.id)) return false;
  return patchKnown(token, ctx);
}

function clearContext(ctx: Context): void {
  ctx.containers.clear();
  ctx.entries.clear();
  ctx.known.clear();
  ctx.owners.clear();
}

function projectRoots(roots: readonly LiveToken[], ctx: Context): readonly Node[] {
  return roots.flatMap(root => project(root, ctx));
}

function report(options: {readonly ctx: Context; readonly error: ProjectionError}): void {
  options.ctx.reportError({cause: options.error.cause, kind: "projection"});
}

function projectionFailure(cause: unknown): ProjectionError {
  return cause instanceof ProjectionError ? cause : new ProjectionError({cause});
}

function projectionError(cause: Cause.Cause<ProjectionError>): ProjectionError {
  const error = Cause.findErrorOption(cause);
  return error._tag === "Some" ? error.value : new ProjectionError({cause: Cause.squash(cause)});
}

function guardProject(options: {
  readonly ctx: Context;
  readonly render: () => readonly Node[];
}): readonly Node[] {
  const result = Effect.runSyncExit(Effect.try({catch: projectionFailure, try: options.render}));
  if (Exit.isSuccess(result)) return result.value;
  report({ctx: options.ctx, error: projectionError(result.cause)});
  return [];
}

function removeAll(nodes: readonly Node[]): void {
  for (const node of nodes) node.parentNode?.removeChild(node);
}

/** @since 0.4.0 */
export function createDomRenderer(options: DomRendererOptions): DomRenderer {
  return {
    render(parent, ...roots) {
      let disposed = false;
      let owned: readonly Node[] = [];
      const ctx: Context = {
        containers: new Set(),
        document: parent.ownerDocument,
        entries: new Map(),
        known: new Set(),
        owners: new Map(),
        reportError: options.reportError,
      };
      const unsubscribeFailures = options.runtime.subscribeFailures(failure =>
        options.reportError({failure, kind: "rule"}),
      );
      const unsubscribeWarnings = options.runtime.subscribeWarnings(warning =>
        options.reportError({kind: "warning", warning}),
      );
      const mounted = Effect.runSync(options.runtime.mount(...roots));
      const rebuild = (): void => {
        clearContext(ctx);
        removeAll(owned);
        owned = guardProject({ctx, render: () => projectRoots(mounted.roots, ctx)});
        for (const node of owned) parent.append(node);
      };
      const update = (change: GraphChange): void => {
        if (change.kind === "initial") return;
        const complete = change.tokens.every(token => patch(token, ctx));
        if (!complete) rebuild();
      };
      rebuild();
      const unsubscribe = options.runtime.subscribe(change => {
        if (disposed) return;
        update(change);
      });
      const teardown = (): void => {
        disposed = true;
        removeAll(owned);
        owned = [];
        clearContext(ctx);
        unsubscribe();
        unsubscribeFailures();
        unsubscribeWarnings();
        Effect.runSync(mounted.release);
      };
      return {
        dispose() {
          if (disposed) return;
          teardown();
        },
        mount: mounted,
      };
    },
  };
}
