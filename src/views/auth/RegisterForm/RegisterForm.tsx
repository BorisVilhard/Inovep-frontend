'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { InputField } from '@/app/components/Fields';
import Button from '@/app/components/Button/Button';
import { FormProvider, useForm } from 'react-hook-form';
import { signIn } from 'next-auth/react';
import axios from 'axios';

export interface LoginFormValues {
  username: string;
  password: string;
  confirmPassword: string;
}

const RegisterForm = () => {
  const schema = zod.object({
    username: zod.string().min(1, { message: 'Required' }),
    password: zod.string().min(1, { message: 'Required' }),
    confirmPassword: zod.string().min(1, { message: 'Required' }),
  });

  const methods = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
  });

  const handleRegister = async (data: LoginFormValues) => {
    try {
      await axios.post('http://localhost:3500/register', data, {
        headers: { 'Content-Type': 'application/json' },
      });
      await signIn('credentials', {
        username: data.username,
        password: data.password,
        callbackUrl: '/',
      });
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        console.log('Username already taken. Please try another one.');
      } else {
        console.error('Registration error:', error);
        console.log('An error occurred during registration. Please try again.');
      }
    }
  };

  return (
    <FormProvider {...methods}>
      <form
        className="m-4 flex w-[350px] flex-col"
        onSubmit={methods.handleSubmit((data) => {
          handleRegister(data);
        })}
      >
        <InputField<LoginFormValues>
          name="username"
          placeholder={'username'}
          className="mb-[10px]"
        />
        <InputField<LoginFormValues> name="password" placeholder={'password'} />
        <InputField<LoginFormValues> name="confirmPassword" placeholder={'confirm password'} />

        <Button radius="squared" className="mt-[20px]" htmlType="submit">
          Register
        </Button>
      </form>
    </FormProvider>
  );
};

export default RegisterForm;
