'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useState } from 'react';
import { IoChevronBack } from 'react-icons/io5';
import useRegister from '../api/handleRegister';
import 'react-toastify/dist/ReactToastify.css';
import Switcher from '@/app/components/Switcher/Switcher';
import InputField from '@/app/components/Fields/InputField/InputField';
import PasswordChecker from '../../../../utils/PasswordChecker';
import Button from '@/app/components/Button/Button';

export interface RegisterFormValues {
	username: string;
	password: string;
	email: string;
	confirmPassword: string;
}

const schema = zod
	.object({
		username: zod.string().min(1, { message: 'Username is required' }),
		email: zod
			.string()
			.email({ message: 'Invalid email address' })
			.min(1, { message: 'Email is required' }),
		password: zod
			.string()
			.min(6, { message: 'Password must be at least 6 characters' }),
		confirmPassword: zod
			.string()
			.min(1, { message: 'Confirm password is required' }),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ['confirmPassword'],
	});

const RegisterForm = () => {
	const [activeIndex, setActiveIndex] = useState(0);
	const methods = useForm<RegisterFormValues>({
		resolver: zodResolver(schema),
	});
	const password = methods.watch('password', '');
	const handleRegister = useRegister();
	const totalSteps = 2;

	const handleNext = async () => {
		const fields =
			activeIndex === 0
				? ['username', 'email']
				: ['password', 'confirmPassword'];
		const isValid = await methods.trigger(fields as any);
		if (isValid && activeIndex < totalSteps - 1) {
			setActiveIndex(activeIndex + 1);
		}
	};

	const handleBack = () => {
		if (activeIndex > 0) {
			setActiveIndex(activeIndex - 1);
		}
	};

	return (
		<>
			<FormProvider {...methods}>
				<form
					onSubmit={methods.handleSubmit(handleRegister)}
					className='m-4 flex w-[350px] flex-col gap-5'
				>
					<Switcher activeIndex={activeIndex}>
						<Switcher.Item>
							<InputField name='username' placeholder='Username' />
							<InputField name='email' placeholder='Email' />
						</Switcher.Item>
						<Switcher.Item>
							<InputField
								type='password'
								name='password'
								placeholder='Password'
							/>
							{password && <PasswordChecker password={password} />}
							<InputField
								type='password'
								name='confirmPassword'
								placeholder='Confirm Password'
							/>
						</Switcher.Item>
					</Switcher>
					{activeIndex === totalSteps - 1 ? (
						<div className='mt-[20px] flex w-full items-center gap-2'>
							<Button
								htmlType='button'
								size='small'
								className='rounded-full'
								onClick={handleBack}
							>
								<IoChevronBack className='h-[20px] w-[20px]' />
							</Button>
							<Button htmlType='submit' className='w-full'>
								Register
							</Button>
						</div>
					) : (
						<Button onClick={handleNext} className='mt-5'>
							Next
						</Button>
					)}
				</form>
			</FormProvider>
		</>
	);
};

export default RegisterForm;
