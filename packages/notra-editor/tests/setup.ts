import '@testing-library/jest-dom/vitest';

// jsdom does not implement ResizeObserver; mock it so cmdk and Radix UI work.
global.ResizeObserver = class ResizeObserver {
	observe() {}
	unobserve() {}
	disconnect() {}
};

// jsdom does not implement scrollIntoView; mock it so cmdk works.
window.HTMLElement.prototype.scrollIntoView = function () {};

// jsdom does not implement getClientRects; mock it so ProseMirror's
// coordsAtPos / scrollToSelection path does not throw during tests.
window.Range.prototype.getClientRects = function () {
	return {
		length: 0,
		item: () => null,
		[Symbol.iterator]: function* () {}
	} as unknown as DOMRectList;
};

window.Range.prototype.getBoundingClientRect = function () {
	return new DOMRect(0, 0, 0, 0);
};
