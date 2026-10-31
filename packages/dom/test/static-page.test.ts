import {describe, expect, it} from "vitest";

import {page, ui} from "../../../examples/static/src/page.ts";
import {renderToString} from "../src/index.ts";

describe("static example", () => {
  it("runs the sale rule while rendering to HTML", () => {
    const html = renderToString(ui, page);

    expect(html).toContain("Three plans");
    expect(html).toContain("Basic$10.00");
    expect(html).toContain("Pro$16.00");
    expect(html).toContain("Team$40.00");
    expect(html).toContain("border-color:#c2410c");
  });
});
