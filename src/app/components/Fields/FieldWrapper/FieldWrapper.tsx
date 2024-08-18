import classNames from 'classnames';

import { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  label?: string;
  error: ReactNode;
  success: ReactNode;
  helperText: ReactNode;
  required?: boolean;
  className?: string;
  noBorder?: boolean;
};

const FieldWrapper = ({
  label,
  error,
  success,
  helperText,
  required,
  children,
  className,
  noBorder,
}: Props) => {
  return (
    <div className={className}>
      <div className="mb-1 flex items-center ">
        <div className="label-L2 font-semibold text-primary-90">{label}</div>
        <div>
          {required && (
            <div className="bg-status1-20 ml-2 rounded-full p-0 pb-0 pl-[7px] pr-[7px]">
              <div className="text-status1-70 text-[10px] font-bold">{'Required'}</div>
            </div>
          )}
        </div>
      </div>
      <div
        className={classNames(`rounded border-[1.5px] border-solid border-primary-20`, {
          'border-[2px] border-warning-50': error,
          'border-none': noBorder,
        })}
      >
        {children}
      </div>
      {(error || success || helperText) && (
        <div className="mt-1 flex flex-row items-center">
          <div
            className={classNames(`label-L2 ml-[7px]`, {
              'text-warning-80': error,
              'text-secondary3-70': success,
              'text-neutral-80': helperText,
            })}
          >
            {error || success || helperText}
          </div>
        </div>
      )}
    </div>
  );
};

export default FieldWrapper;
