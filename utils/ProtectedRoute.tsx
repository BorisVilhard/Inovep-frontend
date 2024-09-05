'use client';
import { ReactNode, useEffect } from 'react';
import useStore from '@/views/auth/api/userReponse';
import { useRouter } from 'next/navigation';

interface Props {
  children: ReactNode;
}

const ProtectedRoute = (props: Props) => {
  const { accessToken } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (!accessToken) {
      router.push('auth/login');
    }
  }, [accessToken, router]);

  return accessToken ? props.children : null;
};

export default ProtectedRoute;
