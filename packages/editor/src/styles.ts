/**
 * Default classes of `NotraEditor.Content`.
 *
 * The element that carries them wraps the ProseMirror editable surface, so the rules for the
 * document's nodes use arbitrary descendant variants. Colors only come from shadcn/ui semantic
 * tokens (plus `transparent`), so the editor follows the host's theme and its dark mode.
 */
export const contentClassName: string = [
  // Surface, which fills the minimum height of its container
  'relative min-h-[inherit] w-full min-w-0 text-base leading-7 text-foreground',

  // Editable element, with the behavior that ProseMirror's own stylesheet provides
  '[&_.ProseMirror]:relative [&_.ProseMirror]:min-h-[inherit] [&_.ProseMirror]:whitespace-break-spaces [&_.ProseMirror]:wrap-break-word [&_.ProseMirror]:outline-none [&_.ProseMirror]:[font-variant-ligatures:none]',
  '[&_.ProseMirror>:first-child]:mt-0',
  '[&_.ProseMirror-hideselection]:caret-transparent [&_.ProseMirror-hideselection]:selection:bg-transparent',
  '[&_img.ProseMirror-separator]:m-0 [&_img.ProseMirror-separator]:inline [&_img.ProseMirror-separator]:size-0 [&_img.ProseMirror-separator]:border-0',
  '[&_.ProseMirror-gapcursor]:pointer-events-none [&_.ProseMirror-gapcursor]:absolute [&_.ProseMirror-gapcursor]:m-0 [&_.ProseMirror-gapcursor]:hidden',
  '[&_.ProseMirror-focused_.ProseMirror-gapcursor]:block',
  '[&_.ProseMirror-gapcursor]:after:absolute [&_.ProseMirror-gapcursor]:after:-top-0.5 [&_.ProseMirror-gapcursor]:after:block [&_.ProseMirror-gapcursor]:after:w-5 [&_.ProseMirror-gapcursor]:after:border-t [&_.ProseMirror-gapcursor]:after:border-foreground',
  '[&_.ProseMirror-selectednode]:outline-2 [&_.ProseMirror-selectednode]:outline-offset-2 [&_.ProseMirror-selectednode]:outline-ring',

  // Placeholder of an empty document
  '[&_.is-editor-empty:first-child]:before:pointer-events-none [&_.is-editor-empty:first-child]:before:float-left [&_.is-editor-empty:first-child]:before:h-0 [&_.is-editor-empty:first-child]:before:text-muted-foreground [&_.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]',

  // Blocks
  '[&_p]:my-1',
  '[&_h1]:mt-8 [&_h1]:mb-1 [&_h1]:text-3xl [&_h1]:leading-tight [&_h1]:font-semibold',
  '[&_h2]:mt-6 [&_h2]:mb-1 [&_h2]:text-2xl [&_h2]:leading-tight [&_h2]:font-semibold',
  '[&_h3]:mt-4 [&_h3]:mb-1 [&_h3]:text-xl [&_h3]:leading-snug [&_h3]:font-semibold',
  '[&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-6 [&_ul_ul]:list-[circle] [&_ul_ul_ul]:list-[square]',
  '[&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-6',
  '[&_li]:pl-1 [&_li_p]:my-0.5',
  '[&_blockquote]:my-1 [&_blockquote]:border-l-[3px] [&_blockquote]:border-foreground [&_blockquote]:pl-4',
  '[&_pre]:my-2 [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:px-4 [&_pre]:py-3 [&_pre]:font-mono [&_pre]:text-sm [&_pre]:leading-6 [&_pre]:whitespace-pre-wrap',
  '[&_hr]:my-4 [&_hr]:border-0 [&_hr]:border-t [&_hr]:border-border',

  // Marks
  '[&_strong]:font-semibold',
  '[&_a]:cursor-pointer [&_a]:underline [&_a]:decoration-muted-foreground [&_a]:underline-offset-2',
  '[&_code]:rounded-sm [&_code]:bg-muted [&_code]:px-[0.3em] [&_code]:py-[0.15em] [&_code]:font-mono [&_code]:text-[0.85em]',
  '[&_pre_code]:rounded-none [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-[length:inherit]',
].join(' ')
