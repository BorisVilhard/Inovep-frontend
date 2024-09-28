import { ReactNode } from 'react';
import classNames from 'classnames';

type ButtonType = 'primary' | 'secondary' | 'error' | 'warning';
type ButtonSize = 'large' | 'small' | 'medium';

interface Props {
  block?: boolean;
  size?: ButtonSize;
  type?: ButtonType;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
  htmlType?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  radius?: 'rounded' | 'squared';
}

const Button = ({
  size = 'large',
  type = 'primary',
  children,
  disabled,
  block,
  className,
  htmlType = 'button',
  radius = 'rounded',
  onClick,
}: Props) => {
  return (
    <button
      onClick={onClick}
      type={htmlType}
      className={classNames(
        'flex h-[4vh] cursor-pointer items-center justify-center transition ease-in-out',
        {
          'w-full': block,
          'rounded-[10px]': radius === 'squared',
          'rounded-[50px]': radius === 'rounded',
          'button-B1 min-h-[45px]  px-[35px]  py-[18px]': size === 'large',
          'button-B1 min-h-[28px]  px-[20px]  py-[10px]': size === 'medium',
          'button-B2  min-h-[25px]  px-[10px]': size === 'small',
          'bg-gray-900 text-shades-white': type === 'primary' && !disabled,
          'bg-primary-90 text-shades-white': type === 'secondary' && !disabled,
          'bg-warning-40 text-warning-90': type === 'error' && !disabled,
          'bg-yellow-200 text-yellow-900': type === 'warning' && !disabled,
          'cursor-not-allowed border-neutral-30 bg-neutral-30 text-neutral-60': disabled,
        },
        className,
      )}
      data-disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
