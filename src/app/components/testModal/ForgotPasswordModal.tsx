'use client';

import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import axios from 'axios';
import { toast } from 'react-toastify';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Switcher from '../Switcher/Switcher';
import InputField from '../Fields/InputField/InputField';
import CodeInputField from '../Fields/CodeInputField/CodeInputField';
import PasswordChecker from '../../../../utils/PasswordChecker';
import Button from '../Button/Button';
import Modal from '../Modal';

interface ForgotPasswordModalProps {
	isOpen: boolean;
	onRequestClose: () => void;
}

interface ForgotPasswordFormValues {
	email: string;
}

interface VerifyCodeFormValues {
	code: string;
}

interface ResetPasswordFormValues {
	newPassword: string;
	confirmNewPassword: string;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
	isOpen,
	onRequestClose,
}) => {
	const [step, setStep] = useState<'email' | 'verify' | 'reset'>('email');
	const [email, setEmail] = useState<string>('');
	const [verificationCode, setVerificationCode] = useState<string>('');

	// Validation schemas
	const emailSchema = zod.object({
		email: zod
			.string()
			.email({ message: 'Invalid email' })
			.nonempty({ message: 'Email is required' }),
	});

	const codeSchema = zod.object({
		code: zod.string().length(6, { message: 'Code must be 6 digits' }),
	});

	const passwordSchema = zod
		.object({
			newPassword: zod
				.string()
				.min(6, { message: 'Password must be at least 6 characters' }),
			confirmNewPassword: zod.string(),
		})
		.refine((data) => data.newPassword === data.confirmNewPassword, {
			message: 'Passwords do not match',
			path: ['confirmNewPassword'],
		});

	const emailMethods = useForm<ForgotPasswordFormValues>({
		resolver: zodResolver(emailSchema),
	});

	const codeMethods = useForm<VerifyCodeFormValues>({
		resolver: zodResolver(codeSchema),
	});

	const passwordMethods = useForm<ResetPasswordFormValues>({
		resolver: zodResolver(passwordSchema),
	});

	const handleSubmitEmail = async (data: ForgotPasswordFormValues) => {
		try {
			const response = await axios.post(
				`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/forgot-password`,
				{ email: data.email },
				{ withCredentials: true }
			);
			toast.success(response.data.message);
			setEmail(data.email);
			setStep('verify');
		} catch (error: any) {
			const errorMessage =
				error.response?.data?.message || 'Error, please try again';
			toast.error(errorMessage);
		}
	};

	const handleVerifyCode = async (data: VerifyCodeFormValues) => {
		try {
			const response = await axios.post(
				`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/verify-code`,
				{ email, code: data.code },
				{ withCredentials: true }
			);
			toast.success(response.data.message);
			setVerificationCode(data.code);
			setStep('reset');
		} catch (error: any) {
			const errorMessage =
				error.response?.data?.message || 'Error, please try again';
			toast.error(errorMessage);
		}
	};

	const handleResetPassword = async (data: ResetPasswordFormValues) => {
		try {
			await axios.post(
				`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/reset-password`,
				{
					email,
					code: verificationCode,
					newPassword: data.newPassword,
				},
				{ withCredentials: true }
			);
			toast.success('Password successfully reset');
			closeModal();
		} catch (error: any) {
			const errorMessage =
				error.response?.data?.message || 'Error resetting password';
			toast.error(errorMessage);
		}
	};

	const closeModal = () => {
		setStep('email');
		setEmail('');
		setVerificationCode('');
		emailMethods.reset();
		codeMethods.reset();
		passwordMethods.reset();
		onRequestClose();
	};

	const getTitle = () => {
		switch (step) {
			case 'email':
				return 'Forgot Password';
			case 'verify':
				return 'Verify Code';
			case 'reset':
				return 'Reset Password';
			default:
				return 'Forgot Password';
		}
	};

	const renderContent = () => {
		return (
			<Switcher activeIndex={step === 'email' ? 0 : step === 'verify' ? 1 : 2}>
				<Switcher.Item>
					<FormProvider {...emailMethods}>
						<form
							id='email-form'
							onSubmit={emailMethods.handleSubmit(handleSubmitEmail)}
							className='flex flex-col w-full gap-5'
						>
							<InputField name='email' placeholder='Email' />
						</form>
					</FormProvider>
				</Switcher.Item>
				<Switcher.Item>
					<FormProvider {...codeMethods}>
						<form
							id='verify-form'
							onSubmit={codeMethods.handleSubmit(handleVerifyCode)}
							className='flex flex-col w-full gap-5'
						>
							<CodeInputField
								name='code'
								length={6}
								onComplete={(value: string) =>
									codeMethods.setValue('code', value)
								}
							/>
						</form>
					</FormProvider>
				</Switcher.Item>
				<Switcher.Item>
					<FormProvider {...passwordMethods}>
						<form
							id='reset-form'
							onSubmit={passwordMethods.handleSubmit(handleResetPassword)}
							className='flex flex-col w-full gap-1'
						>
							<InputField
								name='newPassword'
								placeholder='New Password'
								type='password'
							/>
							{passwordMethods.watch('newPassword', '') && (
								<PasswordChecker
									password={passwordMethods.watch('newPassword', '')}
								/>
							)}
							<InputField
								name='confirmNewPassword'
								placeholder='Confirm Password'
								type='password'
							/>
						</form>
					</FormProvider>
				</Switcher.Item>
			</Switcher>
		);
	};

	const renderFooter = () => {
		switch (step) {
			case 'email':
				return (
					<div className='flex justify-end gap-2'>
						<Button htmlType='button' onClick={closeModal}>
							Close
						</Button>
						<Button type='secondary' htmlType='submit' form='email-form'>
							Send Code
						</Button>
					</div>
				);
			case 'verify':
				return (
					<div className='flex justify-end gap-2'>
						<Button htmlType='button' onClick={closeModal}>
							Close
						</Button>
						<Button type='secondary' htmlType='submit' form='verify-form'>
							Verify Code
						</Button>
					</div>
				);
			case 'reset':
				return (
					<div className='flex justify-end gap-2'>
						<Button htmlType='button' onClick={closeModal}>
							Close
						</Button>
						<Button type='secondary' htmlType='submit' form='reset-form'>
							Reset Password
						</Button>
					</div>
				);
			default:
				return null;
		}
	};

	return (
		<>
			<Modal
				isOpen={isOpen}
				onClose={closeModal}
				title={getTitle()}
				footer={renderFooter()}
				className='max-w-lg'
			>
				{renderContent()}
			</Modal>
			<ToastContainer
				position='top-right'
				autoClose={3000}
				hideProgressBar={false}
				newestOnTop={false}
				closeOnClick
				pauseOnFocusLoss
				draggable
				pauseOnHover
			/>
		</>
	);
};

export default ForgotPasswordModal;
