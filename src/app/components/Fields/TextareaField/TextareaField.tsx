import { FieldValues, Path, useFormContext } from 'react-hook-form'
import classNames from 'classnames'
import FieldWrapper from '../FieldWrapper/FieldWrapper'

interface Props<T extends FieldValues> {
  name: Path<T>
  label?: string
  placeholder?: string
  defaultValue?: string
  success?: string
  helperText?: string
  border?: string
  required?: boolean
  disabled?: boolean
}

const TextAreaField = <T extends FieldValues>(props: Props<T>) => {
  const {
    register,
    formState: { errors },
  } = useFormContext()

  return (
    <FieldWrapper
      label={props.label}
      success={props.success}
      error={errors[props.name]?.message as string}
      helperText={props.helperText}
      required={props.required}
    >
      <textarea
        className={classNames(
          `w-full align-top border-none py-[11px] px-[15px] focus:outline-primary-80 opacity-100`,
          {
            'text-neutral-60 bg-neutral-20 cursor-not-allowed': props.disabled === true,
          },
        )}
        placeholder={props.placeholder}
        defaultValue={props.defaultValue}
        disabled={props.disabled}
        {...register(props.name)}
      />
    </FieldWrapper>
  )
}

export default TextAreaField
