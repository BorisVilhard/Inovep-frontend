import { FieldValues, Path, useFormContext } from 'react-hook-form';
import classNames from 'classnames';
import { FaRegEye, FaRegEyeSlash } from 'react-icons/fa';
import FieldWrapper from '../FieldWrapper/FieldWrapper';
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
	step?: string;
	onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const InputField = <T extends FieldValues>(props: Props<T>) => {
	const {
		register,
		formState: { errors },
	} = useFormContext();
	const [showPassword, setShowPassword] = useState(false);

	const togglePasswordVisibility = () => {
		setShowPassword(!showPassword);
	};

	const isPasswordField = props.type === 'password';

	return (
		<FieldWrapper
			label={props.label}
			className={props.className}
			success={props.success}
			error={errors[props.name]?.message as string}
			helperText={props.helperText}
			required={props.required}
		>
			<div className='relative'>
				<input
					onKeyDown={props.onKeyDown}
					className={classNames(
						`h-[4vh] min-h-[45px] w-full border-none px-[15px] opacity-100 focus:outline-primary-80`,
						{
							'cursor-not-allowed bg-neutral-20 text-neutral-60':
								props.disabled === true,
							'pr-10': isPasswordField,
						}
					)}
					type={isPasswordField && showPassword ? 'text' : props.type}
					step={props.step}
					placeholder={props.placeholder}
					defaultValue={props.defaultValue}
					disabled={props.disabled}
					{...register(props.name, { valueAsNumber: props.type === 'number' })}
				/>
				{isPasswordField && (
					<button
						type='button'
						className='absolute right-3 top-1/2 -translate-y-1/2 text-neutral-60 hover:text-neutral-80'
						onClick={togglePasswordVisibility}
					>
						{showPassword ? (
							<FaRegEye size={20} />
						) : (
							<FaRegEyeSlash size={20} />
						)}
					</button>
				)}
			</div>
		</FieldWrapper>
	);
};

export default InputField;
