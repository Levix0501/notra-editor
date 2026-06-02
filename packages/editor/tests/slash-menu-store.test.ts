import { describe, expect, it, vi } from "vitest";

import { filterSlashItems, slashMenuItems } from "../src/slash-menu/items";
import { createSlashStore } from "../src/slash-menu/store";

const rect = () => null;

function opened(command = vi.fn()) {
  const store = createSlashStore();
  store.open({ items: slashMenuItems, command, range: { from: 1, to: 2 }, query: "", clientRect: rect });
  return { store, command };
}

function key(name: string) {
  return new KeyboardEvent("keydown", { key: name });
}

describe("createSlashStore", () => {
  it("starts closed", () => {
    expect(createSlashStore().getSnapshot().open).toBe(false);
  });

  it("open() opens and resets activeIndex to 0", () => {
    const { store } = opened();
    const s = store.getSnapshot();
    expect(s.open).toBe(true);
    expect(s.activeIndex).toBe(0);
    expect(s.items).toHaveLength(8);
  });

  it("notifies subscribers and unsubscribes cleanly", () => {
    const store = createSlashStore();
    const listener = vi.fn();
    const unsub = store.subscribe(listener);
    store.open({ items: slashMenuItems, command: vi.fn(), range: { from: 1, to: 2 }, query: "", clientRect: rect });
    expect(listener).toHaveBeenCalledTimes(1);
    unsub();
    store.close();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("getSnapshot returns a stable reference until mutation", () => {
    const { store } = opened();
    expect(store.getSnapshot()).toBe(store.getSnapshot());
  });

  it("ArrowDown wraps forward", () => {
    const { store } = opened();
    for (let i = 0; i < 7; i++) store.onKeyDown(key("ArrowDown"));
    expect(store.getSnapshot().activeIndex).toBe(7);
    expect(store.onKeyDown(key("ArrowDown"))).toBe(true);
    expect(store.getSnapshot().activeIndex).toBe(0);
  });

  it("ArrowUp wraps backward", () => {
    const { store } = opened();
    store.onKeyDown(key("ArrowUp"));
    expect(store.getSnapshot().activeIndex).toBe(7);
  });

  it("Enter selects the active item and is consumed", () => {
    const { store, command } = opened();
    store.onKeyDown(key("ArrowDown")); // index 1
    expect(store.onKeyDown(key("Enter"))).toBe(true);
    expect(command).toHaveBeenCalledWith(slashMenuItems[1]);
  });

  it("Escape closes and is consumed", () => {
    const { store } = opened();
    expect(store.onKeyDown(key("Escape"))).toBe(true);
    expect(store.getSnapshot().open).toBe(false);
  });

  it("returns false for a printable key and when closed", () => {
    const { store } = opened();
    expect(store.onKeyDown(key("a"))).toBe(false);
    expect(createSlashStore().onKeyDown(key("ArrowDown"))).toBe(false);
  });

  it("update() clamps activeIndex into the shorter list", () => {
    const { store } = opened();
    for (let i = 0; i < 7; i++) store.onKeyDown(key("ArrowDown")); // index 7
    store.update({ items: filterSlashItems(slashMenuItems, "head"), range: { from: 1, to: 5 }, query: "head", clientRect: rect });
    expect(store.getSnapshot().activeIndex).toBe(2); // 3 headings -> max index 2
  });

  it("empty items: Arrow/Enter are consumed no-ops, command not called", () => {
    const command = vi.fn();
    const store = createSlashStore();
    store.open({ items: [], command, range: { from: 1, to: 2 }, query: "zz", clientRect: rect });
    expect(store.onKeyDown(key("ArrowDown"))).toBe(true);
    expect(store.onKeyDown(key("Enter"))).toBe(true);
    expect(command).not.toHaveBeenCalled();
    expect(store.getSnapshot().activeIndex).toBe(0);
  });
});
