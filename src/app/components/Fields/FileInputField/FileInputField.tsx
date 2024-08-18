import { useFormContext, type FieldValues, type Path } from 'react-hook-form';
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
  content?: any;
}
export const FileInputField = <T extends FieldValues>(props: Props<T>) => {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <>
      <FieldWrapper
        label={props.label}
        className={props.className}
        success={props.success}
        error={errors[props.name]?.message as string}
        helperText={props.helperText}
        required={props.required}
        noBorder
      >
        <input id={props.name} type="file" style={{ display: 'none' }} {...register(props.name)} />
        <label className="border-none" htmlFor={props.name}>
          {props.content}
        </label>
      </FieldWrapper>
    </>
  );
};
