import type { Editor } from "@tiptap/core"
import { EditorContent, useEditorState } from "@tiptap/react"
import { cn } from "cn"
import { type ReactNode, useEffect, useMemo, useRef } from "react"

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
  /**
   * Element that menus, popovers and tooltips are rendered into. Defaults to
   * `document.body`. Use it to keep them inside a dialog, a shadow root or a
   * fullscreen element.
   */
  portalContainer?: HTMLElement | null
  /** Extra UI rendered inside the editor root. */
  children?: ReactNode
}

/** Renders an editor created with `useNotraEditor`, including its menus. */
export function NotraEditorView({
  editor: editorProp,
  theme,
  className,
  blockHandle = true,
  bubbleMenu = true,
  portalContainer,
  children,
}: NotraEditorViewProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const themeClassName = useThemeClassName(theme)
  // When `useNotraEditor` re-creates the editor, the previous one is destroyed
  // (without storage and schema) and may still be rendered once.
  const editor = editorProp?.isDestroyed ? null : editorProp

  const state = useEditorState({
    editor,
    selector: ({ editor: instance }) => ({
      dictionary: instance && !instance.isDestroyed ? getNotraStorage(instance).dictionary : defaultDictionary,
      editable: instance?.isEditable ?? false,
    }),
    equalityFn: (a, b) => a.dictionary === b?.dictionary && a.editable === b?.editable,
  })

  const dictionary: NotraDictionary = state?.dictionary ?? defaultDictionary
  const editable = state?.editable ?? false
  const showBlockHandle = blockHandle && editable

  const portalValue = useMemo(
    () => ({ className: cn("notra-scope", themeClassName), container: portalContainer }),
    [themeClassName, portalContainer],
  )

  // Menus rendered by editor plugins (the slash menu) read the container from the storage.
  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    const storage = getNotraStorage(editor)
    storage.portalContainer = portalContainer ?? null
    return () => {
      if (storage.portalContainer === portalContainer) storage.portalContainer = null
    }
  }, [editor, portalContainer])

  const hasTable = editor?.schema.nodes.table !== undefined
  const hasImage = editor?.schema.nodes.image !== undefined

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
                {hasTable ? <TableMenu editor={editor} /> : null}
                <SlashMenu editor={editor} />
                {hasImage ? <ImagePanel editor={editor} /> : null}
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
export function NotraEditor({
  theme,
  className,
  blockHandle,
  bubbleMenu,
  portalContainer,
  children,
  ...options
}: NotraEditorProps) {
  const editor = useNotraEditor(options)

  return (
    <NotraEditorView
      editor={editor}
      theme={theme}
      className={className}
      blockHandle={blockHandle}
      bubbleMenu={bubbleMenu}
      portalContainer={portalContainer}
    >
      {children}
    </NotraEditorView>
  )
}
