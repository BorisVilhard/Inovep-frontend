'use client';
import axios from 'axios';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import Button from '@/app/components/Button/Button';
import { InputField } from '@/app/components/Fields';
import useStore from '@/views/auth/api/userReponse';

interface UpdateUser {
  username: string;
  email: string;
  password: string;
}

const UserForm = () => {
  const { username, email, id, accessToken, logOut } = useStore();
  const schema = zod
    .object({
      username: zod.string().optional(),
      email: zod.string().optional(),
      password: zod.string().optional(),
      confirmPassword: zod.string().optional(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ['confirmPassword'],
    });

  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      username: username || '',
      email: email || '',
      password: '',
      confirmPassword: '',
    },
  });

  const handleUpdate = async (data: UpdateUser) => {
    try {
      const response = await axios.put(
        `http://localhost:3500/users/${id}`,
        {
          username: data.username,
          email: data.email,
          password: data.password,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      alert('User updated successfully!');
      console.log(response.data);
    } catch (error) {
      console.error('Error updating user:', error);
      alert(error);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:3500/users/${id}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      logOut();
      alert('User deleted successfully!');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(error);
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(handleUpdate)} className="m-4 flex w-[350px] flex-col">
        <div className="mt-[100px] flex w-[500px] flex-col gap-5">
          {['username', 'email', 'password', 'confirmPassword'].map((field, index) => (
            <InputField key={index} name={field} placeholder={field} />
          ))}

          <Button htmlType="submit" radius="squared">
            Update
          </Button>
          <Button htmlType="button" type="error" onClick={handleDelete} radius="squared">
            Delete Account
          </Button>
        </div>
      </form>
    </FormProvider>
  );
};

export default UserForm;
