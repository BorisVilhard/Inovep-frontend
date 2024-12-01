import axios from 'axios';
import { useCallback } from 'react';
import { toast } from 'react-toastify';
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
          toast.success(`Welcome ${username}!`);
          router.push('/dashboard');
        }
      } catch (error) {
        toast.error('Login failed. Please check your credentials.');
      }
    },
    [router, store],
  );

  return handleLogin;
};

export default useLogin;
