/** @since 0.4.0 */

import type {GraphChange, LiveToken, TokenRoot, TokenValue, WhuiyRuntime} from "whuiy";
import type {ErrorReporter} from "./errors.ts";

import {Cause, Effect, Exit, Fiber, Predicate, Schema, Stream} from "effect";

import {getDecoratorMetadata, getElementMetadata} from "whuiy/primitives";
import {ProjectionError} from "./errors.ts";

type Handler = (event: Event) => Effect.Effect<void>;

type Entry =
  | {readonly kind: "element"; readonly element: HTMLElement}
  | {readonly kind: "text"; readonly node: Text};

interface StyleOwner {
  readonly element: HTMLElement;
  readonly property: string;
}

interface Context {
  readonly document: Document;
  readonly entries: Map<number, Entry>;
  readonly fibers: Set<Fiber.Fiber<void, never>>;
  readonly owners: Map<number, StyleOwner>;
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
  if (decorator.kind === "event") attachListener(token, element, decorator.property, ctx);
  else decorateStyle(token, element, decorator.property, ctx);
}

function decorateStyle(
  token: LiveToken,
  element: HTMLElement,
  property: string,
  ctx: Context,
): void {
  applyStyle(token, element, property);
  ctx.owners.set(token.id, {element, property});
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
  ctx.entries.set(token.id, {element, kind: "element"});
  decorateChildren(token, element, ctx);
  appendChildren(token, element, ctx);
  return element;
}

function project(token: LiveToken, ctx: Context): readonly Node[] {
  const element = getElementMetadata(token.definition);
  if (element !== undefined) return [projectElement(token, element.tag, ctx)];
  const value = token.value();
  if (Schema.is(StyleValue)(value)) {
    const node = ctx.document.createTextNode(String(value));
    ctx.entries.set(token.id, {kind: "text", node});
    return [node];
  }
  return token.tokens().flatMap(child => project(child, ctx));
}

function applyStylesOf(token: LiveToken, element: HTMLElement, ctx: Context): void {
  for (const child of token.tokens()) decorate(child, element, ctx);
}

function patchEntry(token: LiveToken, entry: Entry, ctx: Context): void {
  if (entry.kind === "text") entry.node.data = textOf(token);
  else applyStylesOf(token, entry.element, ctx);
}

function patchStyleOwner(token: LiveToken, owner: StyleOwner): void {
  applyStyle(token, owner.element, owner.property);
}

function patch(token: LiveToken, ctx: Context): boolean {
  const owner = ctx.owners.get(token.id);
  if (owner !== undefined) return (patchStyleOwner(token, owner), true);
  const entry = ctx.entries.get(token.id);
  if (entry === undefined) return false;
  patchEntry(token, entry, ctx);
  return true;
}

function clearContext(ctx: Context): void {
  ctx.entries.clear();
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

function ignored(disposed: boolean, kind: string): boolean {
  return disposed || kind === "initial";
}

function interrupt(fibers: ReadonlySet<Fiber.Fiber<void, never>>): void {
  for (const fiber of fibers) Effect.runSync(Fiber.interrupt(fiber));
}

/** @since 0.4.0 */
export function createDomRenderer(options: DomRendererOptions): DomRenderer {
  return {
    render(parent, ...roots) {
      const mounted = Effect.runSync(options.runtime.mount(...roots));
      const fibers = new Set<Fiber.Fiber<void, never>>();
      let disposed = false;
      let owned: readonly Node[] = [];
      const ctx: Context = {
        document: parent.ownerDocument,
        entries: new Map(),
        fibers,
        owners: new Map(),
        reportError: options.reportError,
      };
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
      const failures = Effect.runFork(
        Stream.runForEach(options.runtime.ruleFailures, failure =>
          Effect.sync(() => options.reportError({failure, kind: "rule"})),
        ),
      );
      const teardown = (): void => {
        disposed = true;
        removeAll(owned);
        owned = [];
        clearContext(ctx);
        unsubscribe();
        Effect.runSync(Fiber.interrupt(failures));
        interrupt(fibers);
        Effect.runSync(mounted.release);
      };
      return {
        dispose() {
          if (disposed) return;
          teardown();
        },
      };
    },
  };
}
