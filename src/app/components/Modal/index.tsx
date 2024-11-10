import React, { ReactNode, useEffect } from 'react';
import ReactDOM from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer, className }) => {
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
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-40 flex items-center justify-center overflow-auto bg-black bg-opacity-50">
      <div
        className={`relative mx-auto w-full max-w-lg rounded-lg bg-white shadow-lg ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {title && (
          <div className="border-b px-6 py-4">
            <h2 id="modal-title" className="text-xl font-semibold text-gray-800">
              {title}
            </h2>
          </div>
        )}

        <div className="px-6 py-4">{children}</div>

        {footer && (
          <div className="flex justify-end rounded-b-lg bg-gray-100 px-6 py-4">{footer}</div>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default Modal;
