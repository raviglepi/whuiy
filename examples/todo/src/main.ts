import type {ErrorReporter} from "@whuiy/dom";

import {Effect} from "effect";

import {createDomRenderer} from "@whuiy/dom";
import {description, seed, ui} from "./app.ts";

const container = document.querySelector<HTMLElement>("#app");
if (container === null) throw new Error("Missing #app container");

const report: ErrorReporter = self => {
  const message = self.kind === "rule" ? `rule ${self.failure.rule} failed` : "projection failed";
  const status = document.createElement("pre");
  status.textContent = message;
  document.body.append(status);
};

const runtime = Effect.runSync(ui.make());
const renderer = createDomRenderer({reportError: report, runtime});

renderer.render(container, description(seed));
