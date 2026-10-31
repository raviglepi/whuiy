import type {PropertyName, PropertyValue} from "../src/index.ts";
import {describe, expect, it} from "@effect/vitest";

import {Property} from "../src/index.ts";

const checked: PropertyName = "checked";
const placeholder: PropertyValue<"placeholder"> = "what needs doing?";

describe("shared DOM token families", () => {
  it("exports generated property definitions with their value types", () => {
    expect(Property.Checked(true).definition).toBe(Property.Checked);
    expect(Property.Value("").definition).toBe(Property.Value);
    expect(Property.Placeholder(placeholder).definition).toBe(Property.Placeholder);
    expect(checked).toBe("checked");
  });
});
