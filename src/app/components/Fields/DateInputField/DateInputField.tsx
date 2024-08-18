import { FieldValues, Path, useFormContext } from 'react-hook-form';
import FieldWrapper from '../FieldWrapper/FieldWrapper';
import Button from '../../Button/Button';
import { DateRangePicker } from 'react-date-range';
import { useState } from 'react';

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

const DateInputField = <T extends FieldValues>(props: Props<T>) => {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const [openCalendar, setOpenCalenda] = useState(false);

  return (
    <FieldWrapper
      label={props.label}
      className={props.className}
      success={props.success}
      error={errors[props.name]?.message as string}
      helperText={props.helperText}
      required={props.required}
      noBorder
    >
      <div className="relative">
        <Button
          className="bg-shades-white text-shades-black"
          onClick={() => setOpenCalenda(!openCalendar)}
        >
          <div className="text-shades-black">Date</div>
        </Button>

        {openCalendar && (
          <div className="absolute top-20 z-30 rounded-2xl border-2 border-primary-90 bg-shades-white p-4">
            <DateRangePicker onChange={() => {}} />
          </div>
        )}
      </div>
    </FieldWrapper>
  );
};

export default DateInputField;
