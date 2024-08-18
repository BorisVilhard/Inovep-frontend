import { FieldValues, Path, useFormContext } from 'react-hook-form';
import classNames from 'classnames';
import FieldWrapper from '../FieldWrapper/FieldWrapper';

interface Props<T extends FieldValues> {
  name: Path<T>;
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  success?: string;
  helperText?: string;
  hasBorder?: boolean;
  border?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  type?: string;
}

const InputField = <T extends FieldValues>(props: Props<T>) => {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <FieldWrapper
      label={props.label}
      className={props.className}
      success={props.success}
      error={errors[props.name]?.message as string}
      helperText={props.helperText}
      required={props.required}
    >
      <input
        className={classNames(
          `h-[4vh] min-h-[45px] w-full border-none px-[15px] opacity-100 focus:outline-primary-80`,
          {
            'cursor-not-allowed bg-neutral-20 text-neutral-60': props.disabled === true,
          },
        )}
        type={props.type}
        placeholder={props.placeholder}
        defaultValue={props.defaultValue}
        disabled={props.disabled}
        {...register(props.name)}
      />
    </FieldWrapper>
  );
};

export default InputField;
