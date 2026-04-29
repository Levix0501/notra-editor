import {
	useFloating,
	useInteractions,
	useDismiss,
	autoUpdate
} from '@floating-ui/react';
import { useEffect, useMemo } from 'react';

import type { UseFloatingOptions, ReferenceType } from '@floating-ui/react';
import type { CSSProperties } from 'react';

interface UseFloatingElementResult {
	/** Ref callback to attach to the floating element. */
	setFloatingRef: (node: HTMLElement | null) => void;
	/** Inline style with computed position. */
	style: CSSProperties;
	/** Spread onto the floating element to wire dismiss handlers. */
	getFloatingProps: () => Record<string, unknown>;
	/** True once the element has rendered at least once with a position. */
	isMounted: boolean;
}

/**
 * Position a floating element next to a reference DOM node using
 * @floating-ui/react. Re-positions on scroll/resize via autoUpdate while
 * the element is open.
 */
export function useFloatingElement(
	open: boolean,
	reference: ReferenceType | null,
	zIndex: number,
	options: Partial<UseFloatingOptions> = {}
): UseFloatingElementResult {
	const { refs, floatingStyles, context } = useFloating({
		open,
		strategy: 'absolute',
		whileElementsMounted: autoUpdate,
		...options
	});

	useEffect(() => {
		refs.setReference(reference);
	}, [refs, reference]);

	const dismiss = useDismiss(context);
	const { getFloatingProps } = useInteractions([dismiss]);

	const style = useMemo<CSSProperties>(
		() => ({ ...floatingStyles, zIndex }),
		[floatingStyles, zIndex]
	);

	return {
		setFloatingRef: refs.setFloating,
		style,
		getFloatingProps,
		isMounted: open && reference !== null
	};
}
