import type { Editor } from "@tiptap/core"

import { getNotraStorage } from "./notra-core"
import { getBlockInsertPosition } from "./table"

export const IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/avif",
  "image/svg+xml",
] as const

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener("load", () => resolve(String(reader.result)))
    reader.addEventListener("error", () => reject(reader.error))
    reader.readAsDataURL(file)
  })
}

/**
 * Resolves a displayable URL for an image file. Uses the `uploadImage`
 * handler when one is configured and falls back to a data URL otherwise.
 */
export async function resolveImageSource(editor: Editor, file: File): Promise<string> {
  const { uploadImage } = getNotraStorage(editor)
  return uploadImage ? uploadImage(file) : readAsDataUrl(file)
}

/** Uploads image files and inserts them at `position` (defaults to the selection). */
export async function insertImageFiles(editor: Editor, files: readonly File[], position?: number): Promise<void> {
  let insertAt = position ?? editor.state.selection.from

  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      continue
    }

    let src: string
    try {
      src = await resolveImageSource(editor, file)
    } catch (error) {
      console.error("[notra-editor] Failed to upload image:", error)
      continue
    }

    if (editor.isDestroyed) {
      return
    }

    // The document may have changed while uploading. Images go after tables whose cells only hold text.
    insertAt = getBlockInsertPosition(editor.state.doc, Math.min(insertAt, editor.state.doc.content.size))
    editor
      .chain()
      .insertContentAt(insertAt, { type: "image", attrs: { src, alt: file.name } })
      .focus()
      .run()
    insertAt = editor.state.selection.to
  }
}
