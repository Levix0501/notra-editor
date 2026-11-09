import type { Editor } from "@tiptap/core"
import { ChevronDownIcon } from "lucide-react"

import { type BlockTypeId, blockTypes, convertBlock } from "#blocks/block-types.ts"
import { useDictionary } from "#components/dictionary-context.tsx"
import { ToolbarTooltip } from "#components/toolbar.tsx"
import { Button } from "#components/ui/button.tsx"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "#components/ui/dropdown-menu.tsx"

interface TurnIntoMenuProps {
  editor: Editor
  activeId: BlockTypeId | undefined
}

export function TurnIntoMenu({ editor, activeId }: TurnIntoMenuProps) {
  const dictionary = useDictionary()
  const activeTitle = activeId ? dictionary.blocks[activeId] : dictionary.bubbleMenu.turnInto

  const turnInto = (id: BlockTypeId) => {
    const blockType = blockTypes.find((type) => type.id === id)
    if (blockType) convertBlock(editor, blockType)
  }

  return (
    <DropdownMenu modal={false}>
      <ToolbarTooltip
        label={dictionary.bubbleMenu.turnInto}
        render={
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="sm">
                <span className="nt:max-w-28 nt:truncate">{activeTitle}</span>
                <ChevronDownIcon className="nt:opacity-50" />
              </Button>
            }
          />
        }
      />
      <DropdownMenuContent finalFocus={false} sideOffset={8} className="nt:w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{dictionary.bubbleMenu.turnInto}</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={activeId ?? null} onValueChange={turnInto}>
            {blockTypes.map((blockType) => {
              const Icon = blockType.icon
              return (
                <DropdownMenuRadioItem key={blockType.id} value={blockType.id} closeOnClick>
                  <Icon />
                  {dictionary.blocks[blockType.id]}
                </DropdownMenuRadioItem>
              )
            })}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
