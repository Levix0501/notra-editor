import {
  autoUpdate,
  flip,
  offset,
  shift,
  size,
  useFloating,
  useTransitionStyles,
} from "@floating-ui/react";
import type { Editor } from "@tiptap/core";
import type { CSSProperties } from "react";
import { useCallback, useLayoutEffect, useRef, useSyncExternalStore } from "react";

import { getSlashStore } from "./extension";
import type { SlashMenuItem } from "./items";
import { createSlashStore, type SlashState } from "./store";
import { useOutsidePointerDown } from "./use-outside-pointerdown";

type SlashView = { items: SlashMenuItem[]; activeIndex: number; query: string };

// Stable fallback so hooks stay unconditional while editor is null.
const FALLBACK_STORE = createSlashStore();
const FALLBACK_RECT = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  toJSON() {
    return this;
  },
} as DOMRect;

export function useSlashMenu({ editor }: { editor: Editor | null }): {
  state: SlashState;
  view: SlashView;
  isMounted: boolean;
  refs: ReturnType<typeof useFloating>["refs"];
  style: CSSProperties;
  onSelect: (index: number) => void;
  onPointerEnter: (index: number) => void;
} {
  const store = (editor ? getSlashStore(editor) : null) ?? FALLBACK_STORE;

  const subscribe = useCallback((listener: () => void) => store.subscribe(listener), [store]);
  const getSnapshot = useCallback(() => store.getSnapshot(), [store]);
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // Last view (items/highlight/query) shown while the menu was open. close() resets the
  // store to CLOSED (items: []), but useTransitionStyles keeps the menu mounted through the
  // close transition. Since index.tsx hides the menu on an empty list, rendering the wiped
  // [] mid-transition would drop the menu instantly and cut the fade-out. Retaining the last
  // open snapshot lets a populated menu fade out unchanged. Same rationale as rectRef below —
  // updated during render (not in an effect) so the opening frame shows the real items
  // immediately instead of a stale/empty one.
  const viewRef = useRef<SlashView>({
    items: state.items,
    activeIndex: state.activeIndex,
    query: state.query,
  });
  if (state.open) {
    viewRef.current = {
      items: state.items,
      activeIndex: state.activeIndex,
      query: state.query,
    };
  }
  const view = viewRef.current;

  const { refs, floatingStyles, context, update } = useFloating({
    open: state.open,
    placement: "bottom-start",
    transform: false,
    middleware: [
      offset(6),
      flip(),
      shift({ padding: 8 }),
      size({
        apply({ availableHeight, elements }) {
          elements.floating.style.maxHeight = `${Math.min(availableHeight, 320)}px`;
        },
      }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const { isMounted, styles: transitionStyles } = useTransitionStyles(context, {
    duration: { open: 150, close: 100 },
    initial: { opacity: 0, transform: "scale(0.95)" },
  });

  // Last known good caret rect. While the menu is closing, the store clears clientRect
  // (it becomes null), so without this the reference would fall back to (0,0) and the
  // still-mounted exit transition would flash in the top-left corner. Retaining the last
  // rect keeps the menu fading out in place at the caret.
  const rectRef = useRef<DOMRect>(FALLBACK_RECT);

  // Set the virtual reference once. Recreating it on every keystroke would tear down and
  // rebuild floating-ui's autoUpdate loop each time, forcing extra synchronous layout reads.
  useLayoutEffect(() => {
    refs.setReference({ getBoundingClientRect: () => rectRef.current });
  }, [refs]);

  // Anchor to the "/" caret rect and reposition. useLayoutEffect positions before paint so
  // the menu never shows a frame at a stale spot.
  useLayoutEffect(() => {
    const next = state.clientRect?.();
    if (next) rectRef.current = next;
    update();
  }, [state.clientRect, update]);

  const onOutside = useCallback(() => store.close(), [store]);
  useOutsidePointerDown(refs.floating, state.open, onOutside);

  const onSelect = useCallback(
    (index: number) => {
      store.setActiveIndex(index);
      store.selectActive();
    },
    [store],
  );
  const onPointerEnter = useCallback((index: number) => store.setActiveIndex(index), [store]);

  return {
    state,
    view,
    isMounted,
    refs,
    style: { ...floatingStyles, ...transitionStyles },
    onSelect,
    onPointerEnter,
  };
}
