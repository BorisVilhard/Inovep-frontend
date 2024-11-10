'use client';
import useAuthStore, { selectCurrentUser } from '@/views/auth/api/userReponse';
import PasswordChecker from '../../../../utils/PasswordChecker';
import React, { useState } from 'react';
import axios from 'axios';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import Button from '@/app/components/Button/Button';
import { InputField } from '@/app/components/Fields';

interface UpdateUser {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const UserForm = () => {
  const { id, username, email, accessToken } = useAuthStore(selectCurrentUser);

  const setCredentials = useAuthStore((state) => state.setCredentials);
  const logOut = useAuthStore((state) => state.logOut);

  const schema = zod
    .object({
      username: zod.string().optional(),
      email: zod.string().email({ message: 'Invalid email address' }).optional(),
      password: zod.string().optional(),
      confirmPassword: zod.string().optional(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ['confirmPassword'],
    });

  // Initialize the form with react-hook-form
  const methods = useForm<UpdateUser>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: username || '',
      email: email || '',
      password: '',
      confirmPassword: '',
    },
  });

  // Watch password fields for validation
  const password = methods.watch('password', '');
  const confirmPassword = methods.watch('confirmPassword', '');

  // Handle form submission for updating user information
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
            'Content-Type': 'application/json',
          },
        },
      );

      // Success message
      alert('User updated successfully!');
      console.log(response.data);

      // Update the store with new user data
      if (response.data.user) {
        const updatedUser = response.data.user;

        // Use existing accessToken since it's unchanged
        setCredentials(updatedUser._id, updatedUser.username, updatedUser.email, accessToken!);

        // Reset the form with updated values
        methods.reset({
          username: updatedUser.username || '',
          email: updatedUser.email || '',
          password: '',
          confirmPassword: '',
        });
      }
    } catch (error) {
      console.error('Error updating user:', error);

      let errorMessage = 'An error occurred while updating.';

      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Server responded with a status other than 2xx
          errorMessage = error.response.data.message || errorMessage;
        } else if (error.request) {
          // Request was made but no response received
          errorMessage = 'No response received from the server.';
        } else {
          // Something happened while setting up the request
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        // Non-Axios error
        errorMessage = error.message;
      }

      alert(errorMessage);
    }
  };

  // Handle account deletion
  const handleDelete = async () => {
    const confirmDeletion = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.',
    );
    if (!confirmDeletion) {
      return;
    }

    try {
      await axios.delete(`http://localhost:3500/users/${id}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      logOut();
      alert('User deleted successfully!');
    } catch (error) {
      console.error('Error deleting user:', error);

      let errorMessage = 'An error occurred while deleting the account.';

      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Server responded with a status other than 2xx
          errorMessage = error.response.data.message || errorMessage;
        } else if (error.request) {
          // Request was made but no response received
          errorMessage = 'No response received from the server.';
        } else {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      alert(errorMessage);
    }
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(handleUpdate)}
        className="m-4 flex w-[350px] flex-col items-center"
      >
        <h1 className="text-[30px] font-bold">Hello {username}</h1>
        <div className="mt-[30px] flex w-[500px] flex-col gap-5">
          {['username', 'email', 'password', 'confirmPassword'].map((field, index) => (
            <React.Fragment key={index}>
              <InputField
                name={field}
                placeholder={field
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, (str) => str.toUpperCase())}
                type={field.includes('password') ? 'password' : 'text'}
              />
              {field === 'password' && password && <PasswordChecker password={password || ''} />}
            </React.Fragment>
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
