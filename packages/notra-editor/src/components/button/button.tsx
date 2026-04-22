import { forwardRef } from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: 'default' | 'ghost' | 'primary';
	size?: 'small' | 'default' | 'large';
	active?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{
			children,
			className,
			variant = 'ghost',
			size = 'default',
			active,
			...props
		},
		ref
	) => {
		const classNames = ['tiptap-button', className].filter(Boolean).join(' ');

		return (
			<button
				ref={ref}
				className={classNames}
				data-active-state={active ? 'on' : undefined}
				data-size={size !== 'default' ? size : undefined}
				data-style={variant !== 'default' ? variant : undefined}
				{...props}
			>
				{children}
			</button>
		);
	}
);

Button.displayName = 'Button';
