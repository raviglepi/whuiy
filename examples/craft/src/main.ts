import type {ErrorReporter, WhuiyDomReport} from "@whuiy/dom";
import type {GraphChange, LiveToken} from "whuiy";

import {Cause, Effect} from "effect";

import {createDomRenderer} from "@whuiy/dom";
import {Token} from "whuiy";
import {description, narrowOf, routeOf, sheetOpenOf, ui} from "./app.ts";

const container = document.querySelector<HTMLElement>("#app");
const status = document.createElement("pre");
status.id = "status";
status.hidden = true;
document.body.append(status);

if (container === null) throw new Error("Missing #app container");

function messageOf(report: WhuiyDomReport): string {
  if (report.kind === "rule")
    return `rule ${report.failure.rule} failed: ${causeText(report.failure.cause)}`;
  if (report.kind === "warning") return `warning: ${report.warning.message}`;
  return errorMessage(report);
}

function causeText(cause: Cause.Cause<never>): string {
  const squashed = Cause.squash(cause);
  return squashed instanceof Error ? squashed.message : String(squashed);
}

function errorMessage(report: Extract<WhuiyDomReport, {cause: unknown}>): string {
  return report.cause instanceof Error ? report.cause.message : "projection failed";
}

const seen = new Set<string>();

const report: ErrorReporter = self => {
  seen.add(messageOf(self));
  status.textContent = [...seen].join("\n");
  status.hidden = false;
};

const runtime = Effect.runSync(ui.make());
const renderer = createDomRenderer({reportError: report, runtime});
const page = renderer.render(container, description);
const root = page.mount.roots[0];

if (root === undefined) throw new Error("Craft has exactly one root");

const route = routeOf(root);
const narrow = narrowOf(root);
const open = sheetOpenOf(root);

const routeNow = (): string => {
  const path = globalThis.location.hash.slice(1);
  return path === "" ? "/" : path;
};

const focusSearch = (): void => {
  globalThis.requestAnimationFrame(() => {
    document.querySelector<HTMLInputElement>("#search-input")?.focus();
  });
};

const setOpen = (value: boolean): void => {
  Effect.runSync(open.pipe(Token.setValue(value)));
  if (value) focusSearch();
};

const openedNow = (change: GraphChange): boolean =>
  change.kind !== "initial" &&
  change.tokens.some(token => token.id === open.id) &&
  open.value() === true;

// The sheet can also be opened from inside the graph, so watch the fact.
runtime.subscribe(change => {
  if (openedNow(change)) focusSearch();
});

const toggle = (token: LiveToken): void => {
  const next = token.value() !== true;
  Effect.runSync(token.pipe(Token.setValue(next)));
  if (next) focusSearch();
};

window.addEventListener("hashchange", () => {
  Effect.runSync(route.pipe(Token.setValue(routeNow())));
  setOpen(false);
});

window
  .matchMedia("(max-width: 860px)")
  .addEventListener("change", event => Effect.runSync(narrow.pipe(Token.setValue(event.matches))));

const isPaletteChord = (event: KeyboardEvent): boolean =>
  (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";

window.addEventListener("keydown", (event: KeyboardEvent) => {
  if (event.key === "Escape") setOpen(false);
  if (isPaletteChord(event)) {
    event.preventDefault();
    toggle(open);
  }
});
