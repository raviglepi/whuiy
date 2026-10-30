import type {ErrorReporter} from "@whuiy/dom";

import {Effect} from "effect";

import {createDomRenderer} from "@whuiy/dom";
import {description, ui} from "./app.ts";

const container = document.querySelector<HTMLElement>("#app");
const status = document.createElement("pre");
status.id = "status";
document.body.append(status);

if (container === null) throw new Error("Missing #app container");

const report: ErrorReporter = self => {
  const message =
    self.kind === "rule"
      ? `rule ${self.failure.rule} failed`
      : self.cause instanceof Error
        ? self.cause.message
        : "projection failed";
  status.textContent = message;
};

const runtime = Effect.runSync(ui.make());
const renderer = createDomRenderer({reportError: report, runtime});

renderer.render(container, description);
