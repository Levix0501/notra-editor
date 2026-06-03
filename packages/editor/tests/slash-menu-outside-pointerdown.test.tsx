import { fireEvent, render } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it, vi } from "vitest";

import { useOutsidePointerDown } from "../src/slash-menu/use-outside-pointerdown";

function Probe({ active, onOutside }: { active: boolean; onOutside: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useOutsidePointerDown(ref, active, onOutside);
  return (
    <div>
      <div ref={ref} data-testid="inside">
        inside
      </div>
      <div data-testid="outside">outside</div>
    </div>
  );
}

describe("useOutsidePointerDown", () => {
  it("fires onOutside for a pointerdown outside the ref", () => {
    const onOutside = vi.fn();
    const { getByTestId } = render(<Probe active onOutside={onOutside} />);
    fireEvent.pointerDown(getByTestId("outside"));
    expect(onOutside).toHaveBeenCalledTimes(1);
  });

  it("ignores a pointerdown inside the ref", () => {
    const onOutside = vi.fn();
    const { getByTestId } = render(<Probe active onOutside={onOutside} />);
    fireEvent.pointerDown(getByTestId("inside"));
    expect(onOutside).not.toHaveBeenCalled();
  });

  it("does nothing while inactive", () => {
    const onOutside = vi.fn();
    const { getByTestId } = render(<Probe active={false} onOutside={onOutside} />);
    fireEvent.pointerDown(getByTestId("outside"));
    expect(onOutside).not.toHaveBeenCalled();
  });
});
