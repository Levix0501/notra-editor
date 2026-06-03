import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GripIcon } from "../src/drag-handle/grip-icon";

describe("GripIcon", () => {
  it("renders an svg with six dots", () => {
    const { container } = render(<GripIcon />);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.querySelectorAll("circle")).toHaveLength(6);
  });
});
