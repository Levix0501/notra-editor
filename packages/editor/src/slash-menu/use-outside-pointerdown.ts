import type { RefObject } from "react";
import { useEffect } from "react";

// Calls `onOutside` when a pointerdown occurs outside `ref` while `active`.
// Capture phase so it runs before menu-internal handlers; clicks inside the
// referenced element (e.g. menu rows) are ignored so selection still works.
export function useOutsidePointerDown(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  onOutside: () => void,
): void {
  useEffect(() => {
    if (!active) return;
    const handle = (event: Event) => {
      const el = ref.current;
      if (el && !el.contains(event.target as Node)) onOutside();
    };
    document.addEventListener("pointerdown", handle, true);
    return () => document.removeEventListener("pointerdown", handle, true);
  }, [ref, active, onOutside]);
}
