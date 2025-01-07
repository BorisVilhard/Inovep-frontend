// utils/hooks/useInitializeDashboardData.ts
import { useState, useEffect } from 'react';
import { DashboardCategory, CombinedChart, Entry, ChartType } from '@/types/types';
import { initializeDashboardData } from '../InitializedDashboardData';

interface InitializedData {
  combinedData: { [category: string]: CombinedChart[] };
  summaryData: { [category: string]: Entry[] };
  appliedChartTypes: { [category: string]: ChartType };
  checkedIds: { [category: string]: string[] };
}

const useInitializeDashboardData = (dashboardData: DashboardCategory[] | null) => {
  const [initializedData, setInitializedData] = useState<InitializedData>({
    combinedData: {},
    summaryData: {},
    appliedChartTypes: {},
    checkedIds: {},
  });

  useEffect(() => {
    if (dashboardData) {
      const data = initializeDashboardData(dashboardData);
      setInitializedData(data);
    }
  }, [dashboardData]);

  return initializedData;
};

export default useInitializeDashboardData;
