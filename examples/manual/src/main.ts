import {mount} from "./generated.ts";

const container = document.querySelector<HTMLElement>("#app");
if (container === null) throw new Error("Missing #app container");
mount(container);
