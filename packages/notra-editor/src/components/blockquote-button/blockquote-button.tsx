import { forwardRef, useCallback, useEffect, useState } from 'react';

import { Button } from '../button/button';
import { BlockquoteIcon } from '../../icons/blockquote-icon';

import type { Editor } from '@tiptap/core';

export interface BlockquoteButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  editor: Editor | null;
}

export const BlockquoteButton = forwardRef<
  HTMLButtonElement,
  BlockquoteButtonProps
>(({ editor, onClick, ...buttonProps }, ref) => {
  const [isActive, setIsActive] = useState(false);
  const [canToggle, setCanToggle] = useState(false);

  useEffect(() => {
    if (!editor) return;

    const update = () => {
      setIsActive(editor.isActive('blockquote'));
      setCanToggle(editor.isEditable && editor.can().toggleBlockquote());
    };

    update();

    editor.on('selectionUpdate', update);
    editor.on('transaction', update);

    return () => {
      editor.off('selectionUpdate', update);
      editor.off('transaction', update);
    };
  }, [editor]);

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);

      if (event.defaultPrevented) return;

      editor?.chain().focus().toggleBlockquote().run();
    },
    [editor, onClick]
  );

  return (
    <Button
      ref={ref}
      aria-label="Blockquote"
      aria-pressed={isActive}
      data-active-state={isActive ? 'on' : 'off'}
      disabled={!canToggle}
      tabIndex={-1}
      type="button"
      variant="ghost"
      onClick={handleClick}
      {...buttonProps}
    >
      <BlockquoteIcon className="tiptap-button-icon" />
    </Button>
  );
});

BlockquoteButton.displayName = 'BlockquoteButton';
