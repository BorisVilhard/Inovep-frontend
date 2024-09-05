import axios from 'axios';
import { RegisterFormValues } from '../RegisterForm/RegisterForm';
import { useCallback } from 'react';
import useStore from './userReponse';
import { showFlashMessage } from '@/app/components/FlashMessgae/FlashMessage';
import { useRouter } from 'next/navigation';
import { LoginFormValues } from '../LoginForm/LoginForm';

const useLogin = () => {
  const router = useRouter();
  const store = useStore();

  const handleLogin = useCallback(
    async (data: LoginFormValues) => {
      try {
        const response = await axios.post(
          'http://localhost:3500/auth',
          {
            user: data.username,
            pwd: data.password,
          },
          {
            withCredentials: true,
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

  return handleLogin;
};

export default useLogin;
