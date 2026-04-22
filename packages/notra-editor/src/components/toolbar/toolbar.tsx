import { forwardRef } from 'react';

export interface ToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
	variant?: 'fixed' | 'floating';
}

export const Toolbar = forwardRef<HTMLDivElement, ToolbarProps>(
	({ children, className, variant = 'fixed', ...props }, ref) => {
		const classNames = ['tiptap-toolbar', className]
			.filter(Boolean)
			.join(' ');

		return (
			<div
				ref={ref}
				aria-label="toolbar"
				className={classNames}
				data-variant={variant}
				role="toolbar"
				{...props}
			>
				{children}
			</div>
		);
	}
);

Toolbar.displayName = 'Toolbar';

export function ToolbarGroup({
	children,
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	const classNames = ['tiptap-toolbar-group', className]
		.filter(Boolean)
		.join(' ');

	return (
		<div className={classNames} role="group" {...props}>
			{children}
		</div>
	);
}

export interface ToolbarSeparatorProps
	extends React.HTMLAttributes<HTMLDivElement> {
	orientation?: 'horizontal' | 'vertical';
}

export function ToolbarSeparator({
	orientation = 'vertical',
	className,
	...props
}: ToolbarSeparatorProps) {
	const classNames = ['tiptap-separator', className]
		.filter(Boolean)
		.join(' ');

	return (
		<div
			aria-orientation={
				orientation === 'vertical' ? orientation : undefined
			}
			className={classNames}
			data-orientation={orientation}
			role="separator"
			{...props}
		/>
	);
}
