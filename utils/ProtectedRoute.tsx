'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Loading from '@/app/loading';
import * as jwt_decode from 'jwt-decode';
import useAuthStore from '@/views/auth/api/userReponse';

interface Props {
	children: ReactNode;
}

interface DecodedToken {
	exp: number;
}

const ProtectedRoute = ({ children }: Props) => {
	const { accessToken, refreshAccessToken, logOut, isRehydrated } =
		useAuthStore();
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const checkToken = async () => {
			console.log('ProtectedRoute checking token:', {
				accessToken,
				isRehydrated,
			});

			// Wait for rehydration
			if (!isRehydrated) {
				console.log('Waiting for store rehydration...');
				return;
			}

			if (!accessToken) {
				console.log('No access token, attempting refresh...');
				const refreshSuccess = await refreshAccessToken();
				console.log('Refresh success:', refreshSuccess);
				if (!refreshSuccess || !useAuthStore.getState().accessToken) {
					console.log('Refresh failed or no token, redirecting...');
					router.push('/');
					setIsLoading(false);
					return;
				}
			} else {
				try {
					const decoded: DecodedToken = jwt_decode.jwtDecode(accessToken);
					const currentTime = Date.now() / 1000;

					if (decoded.exp < currentTime) {
						console.log('Token expired, attempting refresh...');
						const refreshSuccess = await refreshAccessToken();
						if (!refreshSuccess || !useAuthStore.getState().accessToken) {
							console.log('Refresh failed or no token, redirecting...');
							router.push('/');
							setIsLoading(false);
							return;
						}
					}
				} catch (error) {
					console.error('Token validation error:', error);
					await logOut();
					router.push('/');
					setIsLoading(false);
					return;
				}
			}
			setIsLoading(false);
		};

		checkToken();
	}, [accessToken, refreshAccessToken, logOut, router, isRehydrated]);

	if (isLoading || !isRehydrated) {
		return <Loading />;
	}

	return <>{children}</>;
};

export default ProtectedRoute;
