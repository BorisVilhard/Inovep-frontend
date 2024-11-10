import React, { useState, useRef } from 'react';
import { FieldValues, Path, useFormContext } from 'react-hook-form';
import classNames from 'classnames';
import FieldWrapper from '../FieldWrapper/FieldWrapper';

interface Props<T extends FieldValues> {
  name: Path<T>;
  label?: string;
  length: number;
  loading?: boolean;
  helperText?: string;
  success?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  onComplete: (value: string) => void;
}

const CodeInputField = <T extends FieldValues>({
  name,
  label,
  length,
  loading = false,
  helperText,
  success,
  required,
  disabled,
  className,
  onComplete,
}: Props<T>) => {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const [code, setCode] = useState([...Array(length)].map(() => ''));
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  // Handle input changes
  const processInput = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const value = e.target.value;
    if (/[^0-9]/.test(value)) return;

    const newCode = [...code];
    newCode[idx] = value;
    setCode(newCode);

    if (value && idx < length - 1) {
      inputs.current[idx + 1]?.focus();
    }

    if (newCode.every((num) => num !== '')) {
      onComplete(newCode.join(''));
    }
  };

  // Handle backspace key
  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === 'Backspace' && !code[idx] && idx > 0) {
      const newCode = [...code];
      newCode[idx - 1] = '';
      setCode(newCode);
      inputs.current[idx - 1]?.focus();
    }
  };

  // Handle paste event
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasteData = e.clipboardData.getData('text');
    if (/[^0-9]/.test(pasteData)) return;

    const newCode = pasteData.slice(0, length).split('');
    const updatedCode = [...code];

    newCode.forEach((char, idx) => {
      if (idx < length) {
        updatedCode[idx] = char;
      }
    });

    setCode(updatedCode);

    if (updatedCode.every((num) => num !== '')) {
      onComplete(updatedCode.join(''));
    }

    // Move focus to the last filled input or the next empty one
    const nextEmptyIndex = updatedCode.findIndex((char) => char === '');
    if (nextEmptyIndex !== -1) {
      inputs.current[nextEmptyIndex]?.focus();
    } else {
      inputs.current[length - 1]?.focus();
    }
  };

  return (
    <FieldWrapper
      noBorder
      label={label}
      className={className}
      success={success}
      error={errors[name]?.message as string}
      helperText={helperText}
      required={required}
    >
      <div className="flex items-center">
        {Array.from({ length }).map((_, idx) => (
          <input
            key={idx}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={code[idx]}
            readOnly={loading || disabled}
            className={classNames(
              'mx-1 h-14 w-10 rounded-lg  border-[3.5px] border-solid  text-center text-3xl focus:outline-none',
              {
                'cursor-not-allowed bg-neutral-200 text-neutral-600': loading || disabled,
                'border-primary-30': !errors[name],
                'border-red-500': errors[name],
              },
            )}
            onKeyUp={(e) => handleKeyUp(e, idx)}
            onInput={(e) => processInput(e as React.ChangeEvent<HTMLInputElement>, idx)}
            onPaste={handlePaste}
            ref={(ref) => {
              inputs.current[idx] = ref;
            }}
          />
        ))}
      </div>
    </FieldWrapper>
  );
};

export default CodeInputField;
