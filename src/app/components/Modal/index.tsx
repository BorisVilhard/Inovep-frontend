import React, { ReactNode, useEffect } from 'react';
import ReactDOM from 'react-dom';

interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	title?: string;
	children: ReactNode;
	footer?: ReactNode;
	className?: string;
	noPadding?: boolean;
	width?: string;
}

const Modal: React.FC<ModalProps> = ({
	isOpen,
	onClose,
	title,
	children,
	footer,
	noPadding,
	className,
	width,
}) => {
	useEffect(() => {
		const handleEsc = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && isOpen) {
				onClose();
			}
		};
		window.addEventListener('keydown', handleEsc);
		return () => window.removeEventListener('keydown', handleEsc);
	}, [isOpen, onClose]);

	useEffect(() => {
		const originalOverflow = document.body.style.overflow; // Store the original value

		if (isOpen) {
			document.body.style.overflow = 'hidden'; // Disable scrolling when modal is open
		}

		// Cleanup function to restore the original overflow state
		return () => {
			document.body.style.overflow = originalOverflow || 'auto'; // Restore to original or default 'auto'
		};
	}, [isOpen]); // Only re-run when isOpen changes

	if (!isOpen) return null;

	return ReactDOM.createPortal(
		<div className='fixed inset-0 z-40 flex items-center justify-center overflow-auto bg-black bg-opacity-50'>
			<div
				className={`relative mx-auto w-[${width ? width : '99%'}] md:w-[${
					width ? width : '80%'
				}] rounded-lg bg-white shadow-lg ${className}`}
				role='dialog'
				aria-modal='true'
				aria-labelledby='modal-title'
			>
				{title && (
					<div className='border-b'>
						<h2
							id='modal-title'
							className='text-xl m-5 font-semibold text-gray-800'
						>
							{title}
						</h2>
					</div>
				)}
				<div className={noPadding ? 'p-0' : 'p-4'}>{children}</div>
				{footer && (
					<div className='flex justify-end rounded-b-lg bg-gray-100 px-6 py-4'>
						{footer}
					</div>
				)}
			</div>
		</div>,
		document.body
	);
};

export default Modal;
