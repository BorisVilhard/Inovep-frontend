// utils/handleDashboardSelection.ts
import { DocumentData, DashboardCategory } from '@/types/types';
import { UseFormReset } from 'react-hook-form';
import { DashboardFormValues } from '../DashboardFormValues';

interface Props {
  dashboards: DocumentData[];
  dashboardId: string;
  setDashboardData: React.Dispatch<React.SetStateAction<DocumentData | null>>;
  setDashboardId: React.Dispatch<React.SetStateAction<string | undefined>>;
  setCategories: React.Dispatch<React.SetStateAction<DashboardCategory[]>>;
  setFiles: React.Dispatch<React.SetStateAction<{ filename: string; content: any }[]>>;
  reset: UseFormReset<DashboardFormValues>;
}

export const handleDashboardSelect = ({
  dashboards,
  dashboardId,
  setDashboardData,
  setDashboardId,
  setCategories,
  setFiles,
  reset,
}: Props) => {
  return () => {
    const selectedDashboard = dashboards.find((d) => d._id === dashboardId);
    if (selectedDashboard) {
      setDashboardData(selectedDashboard);
      setDashboardId(selectedDashboard._id);
      setCategories(selectedDashboard.dashboardData);
      setFiles(selectedDashboard.files);
      reset({ dashboardData: selectedDashboard.dashboardData });
    }
  };
};
