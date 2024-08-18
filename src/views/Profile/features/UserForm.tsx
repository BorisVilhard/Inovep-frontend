'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import Image from 'next/image';
import { InputField } from '@/app/components/Fields';
import Button from '@/app/components/Button/Button';
import { FormProvider, useForm } from 'react-hook-form';
import { signIn, useSession } from 'next-auth/react';
import axios from 'axios';
import { FileInputField } from '@/app/components/Fields/FileInputField/FileInputField';
import { FaPlus } from 'react-icons/fa6';

export interface LoginFormValues {
  username: string;
  password: string;
  confirmPassword: string;
}

const UserForm = () => {
  const { data: session, status } = useSession();

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
        className="m-4 flex h-[80vh] w-[28vw] flex-col items-center justify-center gap-5"
        onSubmit={methods.handleSubmit((data) => {
          handleRegister(data);
        })}
      >
        <FileInputField
          name="avatar"
          content={
            <div className="relative">
              <Image
                src={session?.user?.image ? session?.user?.image : '/img/profile.png'}
                width={200}
                height={200}
                alt="profile"
                className="w-[13vw] cursor-pointer rounded-full"
              />
              <a className="absolute bottom-[1%] right-[17%] cursor-pointer rounded-full bg-primary-90 p-[5%]">
                <FaPlus color="white" />
              </a>
            </div>
          }
        />

        <div className="m-4 flex w-full flex-col gap-5">
          <InputField<LoginFormValues> name="username" placeholder={'username'} />
          <InputField<LoginFormValues> name="username" placeholder={'email'} />
          <InputField<LoginFormValues> name="password" placeholder={'password'} />
          <InputField<LoginFormValues> name="confirmPassword" placeholder={'confirm password'} />
          <Button radius="squared" htmlType="submit">
            Edit
          </Button>
        </div>
        <Button radius="squared" className="flex justify-self-start" htmlType="submit">
          Delete User
        </Button>
      </form>
    </FormProvider>
  );
};

export default UserForm;
