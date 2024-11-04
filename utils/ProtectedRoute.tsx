'use client';
import { ReactNode, useEffect, useState } from 'react';
import useStore from '@/views/auth/api/userReponse';
import { useRouter } from 'next/navigation';
import Loading from '@/app/loading';

interface Props {
  children: ReactNode;
}

const ProtectedRoute = (props: Props) => {
  const { accessToken } = useStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) {
      router.push('auth/login');
    } else {
      setIsLoading(false);
    }
  }, [accessToken, router]);

  if (isLoading) {
    return <Loading />;
  }

  return props.children;
};

export default ProtectedRoute;
