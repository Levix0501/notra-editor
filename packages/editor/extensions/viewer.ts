import { Selection } from '@tiptap/extensions';

import { CodeBlockBase } from './code-block-base';
import { SharedExtensions } from './shared';

export const ViewerExtensions = [...SharedExtensions, CodeBlockBase, Selection];
