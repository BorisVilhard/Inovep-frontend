import axios from 'axios';
import { useCallback } from 'react';
import { showFlashMessage } from '@/app/components/FlashMessgae/FlashMessage';
import { useRouter } from 'next/navigation';
import { LoginFormValues } from '../LoginForm/LoginForm';
import useAuthStore from './userReponse';

const useLogin = () => {
  const router = useRouter();
  const store = useAuthStore();

  const handleLogin = useCallback(
    async (data: LoginFormValues) => {
      try {
        const response = await axios.post(
          'http://localhost:3500/auth',
          {
            email: data.email,
            pwd: data.password,
          },
          {
            withCredentials: true,
          },
        );

        if (response.status >= 200 && response.status < 300) {
          const { id, username, email, accessToken } = response.data;
          store.setCredentials(id, username, email, accessToken);
          showFlashMessage(`Welcome ${username}!`, 'success');
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Login error:', error);
        showFlashMessage('Login failed. Please check your credentials.', 'error');
      }
    },
    [router, store],
  );

  return handleLogin;
};

export default useLogin;
