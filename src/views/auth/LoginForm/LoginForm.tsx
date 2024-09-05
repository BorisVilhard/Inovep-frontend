'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { InputField } from '@/app/components/Fields';
import Button from '@/app/components/Button/Button';
import { FormProvider, useForm } from 'react-hook-form';
import useLogin from '../api/handleLogin';

export interface LoginFormValues {
  username: string;
  password: string;
}

const LoginForm = () => {
  const schema = zod.object({
    username: zod.string().min(1, { message: 'Required' }),
    password: zod.string().min(1, { message: 'Required' }),
  });

  const methods = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
  });

  const handleLogin = useLogin();

  return (
    <FormProvider {...methods}>
      <form
        className="m-4 flex w-[350px] flex-col gap-3"
        onSubmit={methods.handleSubmit((data) => {
          handleLogin(data);
        })}
      >
        <InputField<LoginFormValues> name="username" placeholder={'username'} />
        <InputField<LoginFormValues> name="password" placeholder={'password'} />

        <Button radius="squared" className="mt-[20px]" htmlType="submit">
          Login
        </Button>
      </form>
    </FormProvider>
  );
};

export default LoginForm;
