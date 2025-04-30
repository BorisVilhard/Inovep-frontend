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
					`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth`,
					{
						email: data.email,
						pwd: data.password,
					},
					{ withCredentials: true }
				);

				if (response.status >= 200 && response.status < 300) {
					const { id, username, email, accessToken } = response.data;
					store.setCredentials(id, username, email, accessToken);
					toast.success(`Welcome ${username}!`);
					router.push('/dashboard');
				}
			} catch (error: any) {
				const errorMessage =
					error.response?.data?.message ||
					'Login failed. Please check your credentials.';
				toast.error(errorMessage);
			}
		},
		[router, store]
	);

	return handleLogin;
};

export default useLogin;
