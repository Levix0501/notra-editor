import { CodeBlock } from './code-block';
import { SharedExtensions } from './shared';
import { EditorUiState } from './ui-state';

export const EditorExtensions = [...SharedExtensions, CodeBlock, EditorUiState];
