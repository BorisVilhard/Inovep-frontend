import React from 'react';
import { createRoot } from 'react-dom/client';

interface FlashMessageProps {
  message: string;
  type: 'success' | 'error';
  duration?: number;
}

const FlashMessage: React.FC<FlashMessageProps> = ({ message, type }) => {
  return (
    <div
      className={`fixed right-[10px] top-[10vh] z-50  -translate-x-1/2 transform rounded px-7 py-3 text-white shadow-lg ${
        type === 'success' ? 'bg-green-700' : 'bg-red-700'
      }`}
      role="alert"
    >
      {message}
    </div>
  );
};

export const showFlashMessage = (message: string, type: 'success' | 'error', duration = 3000) => {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(<FlashMessage message={message} type={type} />);

  setTimeout(() => {
    root.unmount();
    document.body.removeChild(container);
  }, duration);
};
