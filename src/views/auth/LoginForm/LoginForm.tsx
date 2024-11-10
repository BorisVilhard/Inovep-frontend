'use client';

import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import Button from '@/app/components/Button/Button';
import { FormProvider, useForm } from 'react-hook-form';
import useLogin from '../api/handleLogin';
import ForgotPasswordModal from '@/app/components/testModal/ForgotPasswordModal';
import { InputField } from '@/app/components/Fields';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export interface LoginFormValues {
  email: string;
  password: string;
}

const LoginForm = () => {
  const schema = zod.object({
    email: zod.string().min(1, { message: 'Required' }).email({ message: 'Invalid email' }),
    password: zod.string().min(1, { message: 'Required' }),
  });

  const methods = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
  });

  const handleLogin = useLogin();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const openForgotPasswordModal = () => setIsModalOpen(true);
  const closeForgotPasswordModal = () => setIsModalOpen(false);

  return (
    <>
      <FormProvider {...methods}>
        <form
          className="m-4 flex w-[350px] flex-col gap-3"
          onSubmit={methods.handleSubmit((data) => {
            handleLogin(data);
          })}
        >
          <InputField name="email" placeholder="Email" />
          <InputField name="password" placeholder="Password" type="password" />

          <div className="text-right">
            <button
              type="button"
              className="text-sm text-shades-black underline"
              onClick={openForgotPasswordModal}
            >
              Forgot Password?
            </button>
          </div>

          <Button radius="squared" className="mt-[20px]" htmlType="submit">
            Login
          </Button>
        </form>
      </FormProvider>

      <ForgotPasswordModal isOpen={isModalOpen} onRequestClose={closeForgotPasswordModal} />
      <ToastContainer />
    </>
  );
};

export default LoginForm;
