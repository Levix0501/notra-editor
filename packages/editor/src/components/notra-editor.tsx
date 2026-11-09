import type { Editor } from "@tiptap/core"
import { EditorContent, useEditorState } from "@tiptap/react"
import { cn } from "cn"
import { type ReactNode, useMemo, useRef } from "react"

import { BlockHandle } from "#components/block-handle/block-handle.tsx"
import { NotraBubbleMenu } from "#components/bubble-menu/bubble-menu.tsx"
import { NotraDictionaryContext } from "#components/dictionary-context.tsx"
import { ImagePanel } from "#components/image-panel.tsx"
import { SlashMenu } from "#components/slash-menu/slash-menu.tsx"
import { TableMenu } from "#components/table-menu.tsx"
import { TooltipProvider } from "#components/ui/tooltip.tsx"
import { getNotraStorage } from "#extensions/notra-core.ts"
import { type UseNotraEditorOptions, useNotraEditor } from "#hooks/use-notra-editor.ts"
import { type NotraTheme, useThemeClassName } from "#hooks/use-theme-class-name.ts"
import { createDictionary, type NotraDictionary } from "#i18n/dictionary.ts"
import { NotraPortalContext } from "#lib/portal.tsx"

const defaultDictionary = createDictionary()

export interface NotraEditorViewProps {
  /** The editor instance created with `useNotraEditor`. */
  editor: Editor | null
  /**
   * Color theme. By default the editor follows a `.dark` class or a
   * `data-theme="dark"` attribute on an ancestor element.
   */
  theme?: NotraTheme
  /** Class name of the editor root element. */
  className?: string
  /**
   * Show the block handle (`+` button and drag handle) next to hovered blocks.
   * @default true
   */
  blockHandle?: boolean
  /**
   * Show the formatting toolbar when text is selected.
   * @default true
   */
  bubbleMenu?: boolean
  /** Extra UI rendered inside the editor root. */
  children?: ReactNode
}

/** Renders an editor created with `useNotraEditor`, including its menus. */
export function NotraEditorView({
  editor,
  theme,
  className,
  blockHandle = true,
  bubbleMenu = true,
  children,
}: NotraEditorViewProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const themeClassName = useThemeClassName(theme)

  const state = useEditorState({
    editor,
    selector: ({ editor: instance }) => ({
      dictionary: instance ? getNotraStorage(instance).dictionary : defaultDictionary,
      editable: instance?.isEditable ?? false,
    }),
    equalityFn: (a, b) => a.dictionary === b?.dictionary && a.editable === b?.editable,
  })

  const dictionary: NotraDictionary = state?.dictionary ?? defaultDictionary
  const editable = state?.editable ?? false
  const showBlockHandle = blockHandle && editable

  const portalValue = useMemo(() => ({ className: cn("notra-scope", themeClassName) }), [themeClassName])

  return (
    <NotraDictionaryContext value={dictionary}>
      <NotraPortalContext value={portalValue}>
        <TooltipProvider delay={500}>
          <div
            ref={rootRef}
            data-notra-editor=""
            data-editable={editable}
            data-block-handle={showBlockHandle}
            className={cn("notra-scope notra-editor nt:relative", themeClassName, className)}
          >
            <EditorContent editor={editor} />
            {editor && editable ? (
              <>
                {bubbleMenu ? <NotraBubbleMenu editor={editor} /> : null}
                <TableMenu editor={editor} />
                <SlashMenu editor={editor} />
                <ImagePanel editor={editor} />
                {showBlockHandle ? <BlockHandle editor={editor} rootRef={rootRef} /> : null}
              </>
            ) : null}
            {children}
          </div>
        </TooltipProvider>
      </NotraPortalContext>
    </NotraDictionaryContext>
  )
}

export interface NotraEditorProps extends UseNotraEditorOptions, Omit<NotraEditorViewProps, "editor"> {}

/**
 * A Notion-like rich text editor.
 *
 * @example
 * import { NotraEditor } from "notra-editor"
 * import "notra-editor/styles.css"
 *
 * <NotraEditor content="<p>Hello</p>" onUpdate={(editor) => save(editor.getJSON())} />
 */
export function NotraEditor({ theme, className, blockHandle, bubbleMenu, children, ...options }: NotraEditorProps) {
  const editor = useNotraEditor(options)

  return (
    <NotraEditorView
      editor={editor}
      theme={theme}
      className={className}
      blockHandle={blockHandle}
      bubbleMenu={bubbleMenu}
    >
      {children}
    </NotraEditorView>
  )
}
