'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { InputField } from '@/app/components/Fields';
import Button from '@/app/components/Button/Button';
import Switcher from '@/app/components/Switcher/Switcher';
import { useState } from 'react';
import { IoChevronBack } from 'react-icons/io5';
import PasswordChecker from '../../../../utils/PasswordChecker';
import useRegister from '../api/handleRegister';

export interface RegisterFormValues {
  username: string;
  password: string;
  email: string;
  confirmPassword: string;
}

const schema = zod
  .object({
    username: zod.string().min(1, 'Required'),
    email: zod.string().email('Invalid email address').min(1, 'Required'),
    password: zod.string().min(1, 'Required'),
    confirmPassword: zod.string().min(1, 'Required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password and Confirm password doesn't match",
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

  const handleNext = () => {
    if (activeIndex < totalSteps - 1) {
      setActiveIndex(activeIndex + 1);
    }
  };
  const handleBack = () => {
    if (activeIndex < totalSteps + 1) {
      setActiveIndex(activeIndex - 1);
    }
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(handleRegister)}
        className="m-4 flex w-[350px] flex-col gap-5"
      >
        <Switcher activeIndex={activeIndex}>
          <Switcher.Item>
            <InputField name="username" placeholder="Username" />
            <InputField name="email" placeholder="Email" />
          </Switcher.Item>
          <Switcher.Item>
            <InputField type="password" name="password" placeholder="Password" />
            {password && <PasswordChecker password={password} />}
            <InputField type="password" name="confirmPassword" placeholder="Confirm Password" />
          </Switcher.Item>
        </Switcher>
        {activeIndex === totalSteps - 1 ? (
          <div className="mt-[20px] flex w-full items-center gap-2">
            <Button htmlType="button" size="small" className="rounded-full" onClick={handleBack}>
              <IoChevronBack className="h-[20px] w-[20px]" />
            </Button>
            <Button htmlType="submit" className="w-full">
              Register
            </Button>
          </div>
        ) : (
          <Button onClick={handleNext} className="mt-5">
            Next
          </Button>
        )}
      </form>
    </FormProvider>
  );
};

export default RegisterForm;
