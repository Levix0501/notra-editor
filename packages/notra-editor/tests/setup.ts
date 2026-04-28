import '@testing-library/jest-dom/vitest';

// jsdom does not implement ResizeObserver; mock it so cmdk and Radix UI work.
global.ResizeObserver = class ResizeObserver {
	observe() {}
	unobserve() {}
	disconnect() {}
};

// jsdom does not implement scrollIntoView; mock it so cmdk works.
window.HTMLElement.prototype.scrollIntoView = function () {};
