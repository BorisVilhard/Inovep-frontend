import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import axios from 'axios';
import Button from '../Button/Button';
import InputField from '../Fields/InputField/InputField';

import Modal from '../Modal';
import CodeInputField from '../Fields/CodeInputField/CodeInputField';
import PasswordChecker from '../../../../utils/PasswordChecker';
import { toast } from 'react-toastify';

interface ForgotPasswordProps {
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

const ForgotPasswordModal: React.FC<ForgotPasswordProps> = ({ isOpen, onRequestClose }) => {
  const [step, setStep] = useState<'email' | 'verify' | 'reset'>('email');
  const [email, setEmail] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string>('');

  const emailSchema = zod.object({
    email: zod
      .string()
      .email({ message: 'Invalid email address' })
      .nonempty({ message: 'Email is required' }),
  });

  const codeSchema = zod.object({
    code: zod.string().length(6, { message: 'Verification code must be exactly 6 digits' }),
  });

  const passwordSchema = zod
    .object({
      newPassword: zod.string().min(6, { message: 'Password must be at least 6 characters' }),
      confirmNewPassword: zod.string(),
    })
    .refine((data) => data.newPassword === data.confirmNewPassword, {
      message: "Passwords don't match",
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
        `http://localhost:3500/users/forgot-password`,
        { email: data.email },
        { withCredentials: true },
      );
      toast.success(response.data.message);
      setEmail(data.email);
      setStep('verify');
    } catch (error: any) {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data.message
          ? error.response.data.message
          : 'An error occurred while sending the verification code.';
      toast.error(errorMessage);
    }
  };

  const handleVerifyCode = async (data: VerifyCodeFormValues) => {
    try {
      const response = await axios.post(
        `http://localhost:3500/users/verify-code`,
        { email, code: data.code },
        { withCredentials: true },
      );
      toast.success(response.data.message);
      setVerificationCode(data.code);
      setStep('reset');
    } catch (error: any) {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data.message
          ? error.response.data.message
          : 'An error occurred while verifying the code.';
      toast.error(errorMessage);
    }
  };

  const handleResetPassword = async (data: ResetPasswordFormValues) => {
    try {
      const response = await axios.post(
        `http://localhost:3500/users/reset-password`,
        {
          email,
          code: verificationCode,
          newPassword: data.newPassword,
        },
        { withCredentials: true },
      );
      toast.success(response.data.message);
      closeModal();
    } catch (error: any) {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data.message
          ? error.response.data.message
          : 'An error occurred while resetting the password.';
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

  const renderContent = () => {
    switch (step) {
      case 'email':
        return (
          <FormProvider {...emailMethods}>
            <form
              id="email-form"
              onSubmit={emailMethods.handleSubmit(handleSubmitEmail)}
              className="flex flex-col gap-4"
            >
              <InputField name="email" placeholder="Enter your registered email" />
            </form>
          </FormProvider>
        );
      case 'verify':
        return (
          <FormProvider {...codeMethods}>
            <form
              id="verify-form"
              onSubmit={codeMethods.handleSubmit(handleVerifyCode)}
              className="flex flex-col gap-4"
            >
              <CodeInputField
                name="code"
                length={6}
                onComplete={(value: string) => codeMethods.setValue('code', value)}
              />
            </form>
          </FormProvider>
        );
      case 'reset':
        return (
          <FormProvider {...passwordMethods}>
            <form
              id="reset-form"
              onSubmit={passwordMethods.handleSubmit(handleResetPassword)}
              className="flex flex-col gap-4"
            >
              <InputField name="newPassword" placeholder="Enter new password" type="password" />
              <PasswordChecker password={passwordMethods.watch('newPassword', '')} />

              <InputField
                name="confirmNewPassword"
                placeholder="Confirm new password"
                type="password"
              />
            </form>
          </FormProvider>
        );
      default:
        return null;
    }
  };

  const renderFooter = () => {
    switch (step) {
      case 'email':
        return (
          <div className="mx-[10px] flex w-full items-center justify-between">
            <Button htmlType="button" onClick={closeModal}>
              Close
            </Button>
            <Button type="primary" htmlType="submit" form="email-form">
              Send Verification Code
            </Button>
          </div>
        );
      case 'verify':
        return (
          <div className="flex items-center gap-3">
            <Button htmlType="button" onClick={closeModal}>
              Close
            </Button>
            <Button type="primary" htmlType="submit" form="verify-form">
              Verify Code
            </Button>
          </div>
        );
      case 'reset':
        return (
          <div className="flex items-center gap-3">
            <Button htmlType="button" onClick={closeModal}>
              Close
            </Button>
            <Button type="primary" htmlType="submit" form="reset-form">
              Reset Password
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      title={
        step === 'email' ? 'Forgot Password' : step === 'verify' ? 'Verify Code' : 'Reset Password'
      }
      footer={renderFooter()}
      className="h-auto w-[40%] p-10"
    >
      {renderContent()}
    </Modal>
  );
};

export default ForgotPasswordModal;
