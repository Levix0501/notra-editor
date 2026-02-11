import { offset } from '@floating-ui/react';
import { DragHandle } from '@tiptap/extension-drag-handle-react';
import { useCurrentEditor } from '@tiptap/react';
import { GripVertical } from 'lucide-react';

import { useTranslation } from '../i18n';

const POSITION_CONFIG = {
	middleware: [offset({ mainAxis: 16 })]
};

export function BlockDragHandle() {
	const { editor } = useCurrentEditor();
	const dictionary = useTranslation();

	if (!editor) return null;

	return (
		<DragHandle computePositionConfig={POSITION_CONFIG} editor={editor}>
			<button
				aria-label={dictionary['dragHandle.ariaLabel']}
				className="notra-drag-handle"
				draggable={true}
				type="button"
			>
				<GripVertical size={16} />
			</button>
		</DragHandle>
	);
}
