import React, { useState, FC, ChangeEvent, ReactNode } from 'react';
import classNames from 'classnames';

interface ToggleProps {
  initialState?: boolean;
  onToggle?: (state: boolean) => void;
  className?: string;
  label?: string;
  children1?: ReactNode;
  children2?: ReactNode;
}

const Toggle: FC<ToggleProps> = ({
  initialState = false,
  onToggle,
  className = '',
  children2,
  children1,
}) => {
  const [isToggled, setIsToggled] = useState<boolean>(initialState);

  const handleToggle = (e: ChangeEvent<HTMLInputElement>) => {
    setIsToggled(e.target.checked);
    if (onToggle) {
      onToggle(e.target.checked);
    }
  };

  const toggleId = `toggle-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <label
      htmlFor={toggleId}
      className={classNames('flex min-w-40 cursor-pointer items-center', className)}
      role="switch"
      aria-checked={isToggled}
    >
      <input
        type="checkbox"
        id={toggleId}
        className="sr-only"
        checked={isToggled}
        onChange={handleToggle}
      />
      <div className="relative flex items-center">
        <div
          dir="ltr"
          className={classNames(
            'flex h-8 w-[80px] items-center justify-center rounded-s-lg shadow-inner transition-colors duration-300',
            {
              'bg-blue-600 text-white': isToggled,
              'bg-white': !isToggled,
            },
          )}
        >
          {children1}
        </div>
        <div
          dir="rtl"
          className={classNames(
            'flex h-8 w-[80px] items-center justify-center rounded-s-lg shadow-inner transition-colors duration-300',
            {
              'bg-blue-600 text-white': !isToggled,
              'bg-white': isToggled,
            },
          )}
        >
          {children2}
        </div>
      </div>
    </label>
  );
};

export default Toggle;
