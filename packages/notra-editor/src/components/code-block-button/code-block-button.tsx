import { forwardRef, useCallback, useEffect, useState } from 'react';

import { Button } from '../button/button';
import { CodeBlockIcon } from '../../icons/code-block-icon';

import type { Editor } from '@tiptap/core';

export interface CodeBlockButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  editor: Editor | null;
}

export const CodeBlockButton = forwardRef<
  HTMLButtonElement,
  CodeBlockButtonProps
>(({ editor, onClick, ...buttonProps }, ref) => {
  const [isActive, setIsActive] = useState(false);
  const [canToggle, setCanToggle] = useState(false);

  useEffect(() => {
    if (!editor) return;

    const update = () => {
      setIsActive(editor.isActive('codeBlock'));
      setCanToggle(editor.isEditable && editor.can().toggleCodeBlock());
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

      editor?.chain().focus().toggleCodeBlock().run();
    },
    [editor, onClick]
  );

  return (
    <Button
      ref={ref}
      aria-label="Code Block"
      aria-pressed={isActive}
      data-active-state={isActive ? 'on' : 'off'}
      disabled={!canToggle}
      tabIndex={-1}
      type="button"
      variant="ghost"
      onClick={handleClick}
      {...buttonProps}
    >
      <CodeBlockIcon className="tiptap-button-icon" />
    </Button>
  );
});

CodeBlockButton.displayName = 'CodeBlockButton';
