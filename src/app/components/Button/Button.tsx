import { ReactNode } from 'react';
import classNames from 'classnames';

type ButtonType = 'primary' | 'secondary';
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
        'flex h-[4vh] min-h-[45px] cursor-pointer items-center justify-center transition ease-in-out',
        {
          'w-full': block,
          'rounded-[10px]': radius === 'squared',
          'rounded-[50px]': radius === 'rounded',
          'button-B1 px-[35px] py-[18px]': size === 'large',
          'button-B1 px-[26px] py-[13px]': size === 'medium',
          'button-B2 px-[18px] py-[7px]': size === 'small',
          'bg-shades-black text-shades-white': type === 'primary' && !disabled,
          'bg-primary-90 text-shades-white': type === 'secondary' && !disabled,
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
