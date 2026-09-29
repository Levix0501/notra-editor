'use client'

import { type Context, createContext, useContext, useSyncExternalStore } from 'react'
import type { SlashMenuController, SlashMenuSnapshot } from './controller'
import type { DisplayedItem } from './matching'

/** Carries the controller of the nearest `SlashMenu.Root`. */
export const SlashMenuContext: Context<SlashMenuController | null> =
  createContext<SlashMenuController | null>(null)

/** Carries the displayed item that `SlashMenu.List` renders its child function for. */
export const SlashMenuItemContext: Context<DisplayedItem | null> =
  createContext<DisplayedItem | null>(null)

/**
 * Returns the controller of the nearest `SlashMenu.Root`.
 *
 * @throws When called outside `SlashMenu.Root`.
 */
export function useSlashMenuController(component: string): SlashMenuController {
  const controller = useContext(SlashMenuContext)
  if (!controller)
    throw new Error(`<SlashMenu.${component}> must be rendered inside <SlashMenu.Root>.`)
  return controller
}

/** Returns what the slash menu primitives render, and re-renders the caller when it changes. */
export function useSlashMenuSnapshot(controller: SlashMenuController): SlashMenuSnapshot {
  return useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot)
}
