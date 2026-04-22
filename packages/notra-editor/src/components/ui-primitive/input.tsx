import React from 'react';

export function Input({ className, ...props }: React.ComponentProps<'input'>) {
	const classNames = ['tiptap-input', className].filter(Boolean).join(' ');
	return <input className={classNames} {...props} />;
}
