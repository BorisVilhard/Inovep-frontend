import { unmountComponentAtNode, render } from 'react-dom';
import React from 'react';

interface FlashMessageProps {
  message: string;
  type: 'success' | 'error';
  duration?: number;
}

const FlashMessage: React.FC<FlashMessageProps> = ({ message, type }) => {
  return (
    <div
      className={`fixed left-1/2 top-5 -translate-x-1/2 transform rounded px-4 py-2 text-white shadow-lg ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
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

  render(<FlashMessage message={message} type={type} />, container);

  setTimeout(() => {
    unmountComponentAtNode(container);
    document.body.removeChild(container);
  }, duration);
};
