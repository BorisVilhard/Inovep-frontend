import axios from 'axios';
import { RegisterFormValues } from '../RegisterForm/RegisterForm';
import { useCallback } from 'react';
import useStore from './userReponse';
import { showFlashMessage } from '@/app/components/FlashMessgae/FlashMessage';
import { useRouter } from 'next/navigation';

const useRegister = () => {
  const router = useRouter();
  const store = useStore();

  const handleRegister = useCallback(
    async (data: RegisterFormValues) => {
      if (data.password !== data.confirmPassword) {
        console.error('Passwords do not match.');
        return;
      }

      try {
        const response = await axios.post(
          'http://localhost:3500/register',
          {
            username: data.username,
            email: data.email,
            password: data.password,
          },
          {
            headers: { 'Content-Type': 'application/json' },
          },
        );

        if (response.status === 200 || 201) {
          const { id, username, email, accessToken } = response.data;
          store.setCredentials(id, username, email, accessToken);
          showFlashMessage(`Welcome ${username}!`, 'success');
          router.push('/dashboard');
        }
      } catch (error) {
        console.error(error);
      }
    },
    [router, store],
  );

  return handleRegister;
};

export default useRegister;
