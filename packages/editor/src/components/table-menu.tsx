import { type Editor, findParentNode } from "@tiptap/core"
import { PluginKey } from "@tiptap/pm/state"
import { BubbleMenu, type BubbleMenuProps } from "@tiptap/react/menus"
import {
  BetweenHorizontalEndIcon,
  BetweenHorizontalStartIcon,
  BetweenVerticalEndIcon,
  BetweenVerticalStartIcon,
  type LucideIcon,
  PanelTopIcon,
  TableColumnsSplitIcon,
  TableRowsSplitIcon,
  Trash2Icon,
} from "lucide-react"
import { useCallback, useRef, useState } from "react"

import { useDictionary } from "#components/dictionary-context.tsx"
import { preventFocusLoss, Toolbar, ToolbarSeparator, ToolbarTooltip } from "#components/toolbar.tsx"
import { Button } from "#components/ui/button.tsx"
import { useHideMenuOnFocusLeave } from "#hooks/use-hide-menu-on-focus-leave.ts"
import type { NotraDictionary } from "#i18n/dictionary.ts"

type TableAction = keyof NotraDictionary["table"]

const ACTION_GROUPS: readonly (readonly { action: TableAction; icon: LucideIcon }[])[] = [
  [
    { action: "addRowBefore", icon: BetweenHorizontalStartIcon },
    { action: "addRowAfter", icon: BetweenHorizontalEndIcon },
    { action: "addColumnBefore", icon: BetweenVerticalStartIcon },
    { action: "addColumnAfter", icon: BetweenVerticalEndIcon },
  ],
  [
    { action: "deleteRow", icon: TableRowsSplitIcon },
    { action: "deleteColumn", icon: TableColumnsSplitIcon },
    { action: "toggleHeaderRow", icon: PanelTopIcon },
  ],
  [{ action: "deleteTable", icon: Trash2Icon }],
]

const TABLE_MENU_OPTIONS: BubbleMenuProps["options"] = {
  placement: "bottom",
  offset: 8,
  flip: true,
  shift: { padding: 8 },
}

const shouldShowTableMenu: NonNullable<BubbleMenuProps["shouldShow"]> = ({ editor, view, element }) =>
  editor.isEditable && (view.hasFocus() || element.contains(document.activeElement)) && editor.isActive("table")

function runAction(editor: Editor, action: TableAction): void {
  const chain = editor.chain().focus()
  switch (action) {
    case "addRowBefore":
      chain.addRowBefore().run()
      break
    case "addRowAfter":
      chain.addRowAfter().run()
      break
    case "addColumnBefore":
      chain.addColumnBefore().run()
      break
    case "addColumnAfter":
      chain.addColumnAfter().run()
      break
    case "deleteRow":
      chain.deleteRow().run()
      break
    case "deleteColumn":
      chain.deleteColumn().run()
      break
    case "toggleHeaderRow":
      chain.toggleHeaderRow().run()
      break
    case "deleteTable":
      chain.deleteTable().run()
      break
  }
}

/** A toolbar shown below a table while the selection is inside of it. */
export function TableMenu({ editor }: { editor: Editor }) {
  const dictionary = useDictionary()
  const menuRef = useRef<HTMLDivElement>(null)
  const [pluginKey] = useState(() => new PluginKey("notraTableMenu"))

  useHideMenuOnFocusLeave(editor, menuRef, pluginKey)

  const getReferencedVirtualElement = useCallback(() => {
    const table = findParentNode((node) => node.type.name === "table")(editor.state.selection)
    const dom = table ? editor.view.nodeDOM(table.pos) : null
    if (!(dom instanceof HTMLElement)) return null
    return { getBoundingClientRect: () => dom.getBoundingClientRect(), contextElement: dom }
  }, [editor])

  return (
    <BubbleMenu
      ref={menuRef}
      editor={editor}
      pluginKey={pluginKey}
      updateDelay={100}
      shouldShow={shouldShowTableMenu}
      getReferencedVirtualElement={getReferencedVirtualElement}
      options={TABLE_MENU_OPTIONS}
      className="notra-table-menu nt:z-(--notra-z-index)"
    >
      <Toolbar>
        {ACTION_GROUPS.map((group, groupIndex) => (
          <div key={group[0]?.action} className="nt:flex nt:items-center nt:gap-0.5">
            {groupIndex > 0 ? <ToolbarSeparator /> : null}
            {group.map(({ action, icon: Icon }) => (
              <ToolbarTooltip
                key={action}
                label={dictionary.table[action]}
                render={
                  <Button
                    variant={action === "deleteTable" ? "destructive" : "ghost"}
                    size="icon-sm"
                    aria-label={dictionary.table[action]}
                    onMouseDown={preventFocusLoss}
                    onClick={() => runAction(editor, action)}
                  >
                    <Icon />
                  </Button>
                }
              />
            ))}
          </div>
        ))}
      </Toolbar>
    </BubbleMenu>
  )
}
