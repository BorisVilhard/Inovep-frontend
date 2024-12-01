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
  const { accessToken, refreshAccessToken, logOut } = useAuthStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkToken = async () => {
      if (!accessToken) {
        await refreshAccessToken();
        if (!useAuthStore.getState().accessToken) {
          router.push('/auth/login');
        }
        setIsLoading(false);
        return;
      }

      try {
        const decoded: DecodedToken = jwt_decode.jwtDecode(accessToken);

        const currentTime = Date.now() / 1000;

        if (decoded.exp < currentTime) {
          await refreshAccessToken();
          const newAccessToken = useAuthStore.getState().accessToken;
          if (!newAccessToken) {
            router.push('/auth/login');
          }
        }
      } catch (error) {
        console.error('Token verification failed:', error);
        await logOut();
        router.push('/auth/login');
      }

      setIsLoading(false);
    };

    checkToken();
  }, [accessToken, refreshAccessToken, logOut, router]);

  if (isLoading) {
    return <Loading />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
