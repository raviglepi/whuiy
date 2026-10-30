import {comptime} from "comptime";

import {renderToString} from "@whuiy/dom";
import {page, ui} from "./page.ts";

const html = comptime(() => renderToString(ui, page));

const container = document.querySelector<HTMLElement>("#app");
if (container === null) throw new Error("Missing #app container");
container.innerHTML = html;
