import type { Editor } from "@tiptap/core"
import { cn } from "cn"
import { useLayoutEffect, useRef, useSyncExternalStore } from "react"
import { createPortal } from "react-dom"

import { useDictionary } from "#components/dictionary-context.tsx"
import { preventFocusLoss } from "#components/toolbar.tsx"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "#components/ui/command.tsx"
import type { SlashCommandGroup, SlashCommandItem } from "#extensions/slash-command/items.ts"
import type { SlashMenuStore } from "#extensions/slash-command/store.ts"
import { useNotraPortal } from "#lib/portal.tsx"
import { scrollIntoViewWithin } from "#lib/scroll.ts"

interface Section {
  key: string
  group: SlashCommandGroup | null
  items: SlashCommandItem[]
}

/**
 * Splits the items into sections. Without a query, consecutive items of the
 * same group form a section with a heading; search results are a single list.
 * The flat order is kept, so that keyboard navigation matches the visual order.
 */
function getSections(items: SlashCommandItem[], grouped: boolean): Section[] {
  if (!grouped) {
    return [{ key: "results", group: null, items }]
  }

  const sections: Section[] = []
  for (const item of items) {
    const last = sections.at(-1)
    if (last?.group === item.group) {
      last.items.push(item)
    } else {
      sections.push({ key: `${item.group}-${item.id}`, group: item.group, items: [item] })
    }
  }
  return sections
}

interface SlashMenuListProps {
  store: SlashMenuStore
  items: SlashCommandItem[]
  query: string
  selectedIndex: number
}

function SlashMenuList({ store, items, query, selectedIndex }: SlashMenuListProps) {
  const dictionary = useDictionary()
  const listRef = useRef<HTMLDivElement>(null)
  const selectedId = items[selectedIndex]?.id ?? ""

  // Keyboard navigation happens in the editor, so the list scrolls by itself,
  // without `scrollIntoView()`, which would scroll the page as well.
  useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return
    for (const option of list.querySelectorAll<HTMLElement>("[cmdk-item]")) {
      if (option.dataset.value === selectedId) {
        // Show the group heading together with the first item of a group.
        const isFirst = option.parentElement?.firstElementChild === option
        scrollIntoViewWithin(list, (isFirst && option.closest("[cmdk-group]")) || option, option)
        break
      }
    }
  }, [selectedId])

  const selectById = (id: string) => {
    const index = items.findIndex((item) => item.id === id)
    if (index !== -1 && index !== selectedIndex) store.select(index)
  }

  return (
    <Command shouldFilter={false} value={selectedId} onValueChange={selectById} onMouseDown={preventFocusLoss}>
      <CommandList ref={listRef}>
        <CommandEmpty>{dictionary.slashMenu.noResults}</CommandEmpty>
        {getSections(items, query.length === 0).map((section) => (
          <CommandGroup
            key={section.key}
            heading={section.group ? dictionary.slashMenu.groups[section.group] : undefined}
          >
            {section.items.map((item) => {
              const Icon = item.icon
              return (
                <CommandItem key={item.id} value={item.id} onSelect={() => store.execute(item)}>
                  <Icon />
                  <span className="nt:truncate">{item.title}</span>
                  {item.hint ? <CommandShortcut>{item.hint}</CommandShortcut> : null}
                </CommandItem>
              )
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </Command>
  )
}

/** The block menu opened by typing `/`. */
export function SlashMenu({ editor }: { editor: Editor }) {
  const store = editor.storage.notraSlashCommand.store
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
  const portal = useNotraPortal()

  if (!snapshot.open || !snapshot.element) {
    return null
  }

  return createPortal(
    <div
      data-notra-slash-menu-content=""
      className={cn(
        "nt:w-72 nt:rounded-xl nt:shadow-md nt:ring-1 nt:ring-foreground/10 nt:animate-in nt:fade-in-0 nt:zoom-in-95 nt:duration-100",
        portal.className,
      )}
    >
      <SlashMenuList
        store={store}
        items={snapshot.items}
        query={snapshot.query}
        selectedIndex={snapshot.selectedIndex}
      />
    </div>,
    snapshot.element,
  )
}
