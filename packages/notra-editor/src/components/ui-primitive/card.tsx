import { forwardRef } from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
	style?: React.CSSProperties;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
	({ className, style, ...props }, ref) => {
		const classNames = ['tiptap-card', className].filter(Boolean).join(' ');
		return <div ref={ref} className={classNames} style={style} {...props} />;
	}
);

Card.displayName = 'Card';

export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
	style?: React.CSSProperties;
}

export const CardBody = forwardRef<HTMLDivElement, CardBodyProps>(
	({ className, style, ...props }, ref) => {
		const classNames = ['tiptap-card-body', className].filter(Boolean).join(' ');
		return <div ref={ref} className={classNames} style={style} {...props} />;
	}
);

CardBody.displayName = 'CardBody';

export interface CardItemGroupProps extends React.HTMLAttributes<HTMLDivElement> {
	orientation?: 'horizontal' | 'vertical';
	style?: React.CSSProperties;
}

export const CardItemGroup = forwardRef<HTMLDivElement, CardItemGroupProps>(
	({ className, orientation = 'vertical', style, ...props }, ref) => {
		const classNames = ['tiptap-card-item-group', className]
			.filter(Boolean)
			.join(' ');
		return (
			<div
				ref={ref}
				className={classNames}
				data-orientation={orientation}
				style={style}
				{...props}
			/>
		);
	}
);

CardItemGroup.displayName = 'CardItemGroup';
