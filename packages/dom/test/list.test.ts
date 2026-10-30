import type {LiveToken} from "whuiy";
import {describe, expect, it} from "vitest";

import {Effect} from "effect";

import {Element, Token, Whuiy} from "whuiy";
import {createDomRenderer} from "../src/index.ts";

describe("list projection", () => {
  it("renders one node per sibling and patches only the changed row", () => {
    const Label = Token("Label").content<string>();
    const Text = Token("Text").content<string>();
    const Row = Token("Row")();
    const List = Token("List")();
    let firstRow: LiveToken | undefined;
    let runs = 0;
    const ui = new Whuiy()
      .rule(List(), function* (list) {
        firstRow = list.all(Row)[0];
      })
      .rule(Row(Label()), function* (row) {
        runs += 1;
        yield* row
          .get(Element.Span)
          .get(Text())
          .pipe(Token.setValue(String(row.get(Label).value())));
      });
    const runtime = Effect.runSync(ui.make());
    const parent = document.createElement("main");
    const renderer = createDomRenderer({reportError: () => undefined, runtime});

    renderer.render(
      parent,
      List(Row(Label("a"), Element.Span(Text(""))), Row(Label("b"), Element.Span(Text("")))),
    );

    const spans = [...parent.querySelectorAll("span")];
    expect(spans.map(span => span.textContent)).toEqual(["a", "b"]);
    expect(runs).toBe(2);

    if (firstRow === undefined) throw new Error("Expected a captured row");
    Effect.runSync(firstRow.get(Label).pipe(Token.setValue("z")));

    expect(runs).toBe(3);
    const patched = [...parent.querySelectorAll("span")];
    expect(patched.map(span => span.textContent)).toEqual(["z", "b"]);
    expect(patched[0]).toBe(spans[0]);
  });
});
