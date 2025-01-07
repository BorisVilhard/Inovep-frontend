import { useEffect, useState } from 'react';
import { DocumentData } from '@/types/types';
import { fetchDashboards } from '../api';

interface UseFetchDashboardsProps {
  userId: string | null;
  accessToken: string | null;
}

const useFetchDashboards = ({ userId, accessToken }: UseFetchDashboardsProps) => {
  const [dashboards, setDashboards] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId && accessToken) {
      setLoading(true);
      fetchDashboards(userId, accessToken)
        .then((data) => {
          setDashboards(data);
          setLoading(false);
        })
        .catch((err) => {
          setError('Failed to fetch dashboards.');
          setLoading(false);
        });
    }
  }, [userId, accessToken]);

  return { dashboards, loading, error, setDashboards };
};

export default useFetchDashboards;
