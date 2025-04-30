import axios from 'axios';
import { RegisterFormValues } from '../RegisterForm/RegisterForm';
import { useCallback } from 'react';
import useAuthStore from './userReponse';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

const useRegister = () => {
	const router = useRouter();
	const store = useAuthStore();

	const handleRegister = useCallback(
		async (data: RegisterFormValues) => {
			if (data.password !== data.confirmPassword) {
				toast.error('Passwords do not match.');
				return;
			}

			try {
				const response = await axios.post(
					`${process.env.NEXT_PUBLIC_BACKEND_URL}/register`,
					{
						username: data.username,
						email: data.email,
						password: data.password,
					},
					{
						headers: { 'Content-Type': 'application/json' },
						withCredentials: true,
					}
				);

				if (response.status === 201) {
					const { id, username, email, accessToken } = response.data;
					store.setCredentials(id, username, email, accessToken);
					toast.success(`Welcome ${username}!`);
					router.push('/dashboard');
				}
			} catch (error: any) {
				const errorMessage =
					error.response?.data?.message || 'Registration failed.';
				toast.error(errorMessage);
				if (errorMessage.includes('Email is already in use')) {
					toast.info('Please log in with your existing account.');
					setTimeout(() => {
						router.push('/auth/login');
					}, 2000);
				}
			}
		},
		[router, store]
	);

	return handleRegister;
};

export default useRegister;
