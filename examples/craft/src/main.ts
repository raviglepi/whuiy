import type {ErrorReporter, WhuiyDomReport} from "@whuiy/dom";

import {Cause, Effect} from "effect";

import {createDomRenderer} from "@whuiy/dom";
import {description, ui} from "./app.ts";

const container = document.querySelector<HTMLElement>("#app");
const status = document.createElement("pre");
status.id = "status";
status.hidden = true;
document.body.append(status);

if (container === null) throw new Error("Missing #app container");

function messageOf(report: WhuiyDomReport): string {
  if (report.kind === "rule") {
    return `rule ${report.failure.rule} failed: ${causeText(report.failure.cause)}`;
  }
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

const report: ErrorReporter = self => {
  status.textContent = messageOf(self);
  status.hidden = false;
};

const runtime = Effect.runSync(ui.make());
const renderer = createDomRenderer({reportError: report, runtime});
renderer.render(container, description);
