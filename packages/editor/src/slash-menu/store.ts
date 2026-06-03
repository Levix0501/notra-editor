import type { Range } from "@tiptap/core";

import type { SlashMenuItem } from "./items";

export type SlashCommand = (item: SlashMenuItem) => void;

export type SlashState = {
  open: boolean;
  query: string;
  items: SlashMenuItem[];
  activeIndex: number;
  range: Range | null;
  clientRect: (() => DOMRect | null) | null;
};

export type SlashOpenPayload = {
  items: SlashMenuItem[];
  command: SlashCommand;
  range: Range;
  query: string;
  clientRect: (() => DOMRect | null) | null;
};

export type SlashUpdatePayload = {
  items: SlashMenuItem[];
  command: SlashCommand;
  range: Range;
  query: string;
  clientRect: (() => DOMRect | null) | null;
};

export type SlashStore = {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => SlashState;
  open: (payload: SlashOpenPayload) => void;
  update: (payload: SlashUpdatePayload) => void;
  onKeyDown: (event: KeyboardEvent) => boolean;
  setActiveIndex: (index: number) => void;
  selectActive: () => void;
  close: () => void;
};

const CLOSED: SlashState = {
  open: false,
  query: "",
  items: [],
  activeIndex: 0,
  range: null,
  clientRect: null,
};

function clampIndex(index: number, length: number): number {
  if (length === 0) return 0;
  return Math.max(0, Math.min(index, length - 1));
}

export function createSlashStore(): SlashStore {
  let state: SlashState = CLOSED;
  let command: SlashCommand | null = null;
  const listeners = new Set<() => void>();

  const emit = () => {
    for (const listener of listeners) listener();
  };
  const setState = (next: SlashState) => {
    state = next;
    emit();
  };

  const selectActive = () => {
    const item = state.items[state.activeIndex];
    if (item && command) command(item);
  };
  const close = () => setState(CLOSED);

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot() {
      return state;
    },
    open(payload) {
      command = payload.command;
      setState({
        open: true,
        query: payload.query,
        items: payload.items,
        activeIndex: 0,
        range: payload.range,
        clientRect: payload.clientRect,
      });
    },
    update(payload) {
      command = payload.command;
      setState({
        ...state,
        open: true,
        query: payload.query,
        items: payload.items,
        activeIndex: clampIndex(state.activeIndex, payload.items.length),
        range: payload.range,
        clientRect: payload.clientRect,
      });
    },
    onKeyDown(event) {
      if (!state.open) return false;
      const len = state.items.length;
      switch (event.key) {
        case "ArrowDown":
          if (len > 0) setState({ ...state, activeIndex: (state.activeIndex + 1) % len });
          return true;
        case "ArrowUp":
          if (len > 0) setState({ ...state, activeIndex: (state.activeIndex - 1 + len) % len });
          return true;
        case "Tab": {
          if (len > 0) {
            const next = event.shiftKey
              ? (state.activeIndex - 1 + len) % len
              : (state.activeIndex + 1) % len;
            setState({ ...state, activeIndex: next });
          }
          return true;
        }
        case "Home":
          if (len > 0) setState({ ...state, activeIndex: 0 });
          return true;
        case "End":
          if (len > 0) setState({ ...state, activeIndex: len - 1 });
          return true;
        case "Enter":
          selectActive();
          return true;
        case "Escape":
          close();
          return true;
        default:
          return false;
      }
    },
    setActiveIndex(index) {
      setState({ ...state, activeIndex: clampIndex(index, state.items.length) });
    },
    selectActive,
    close,
  };
}
