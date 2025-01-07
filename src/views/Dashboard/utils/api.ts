// utils/api.ts
import axios from 'axios';
import { DocumentData } from '@/types/types';

const API_BASE_URL = 'http://localhost:3500/data/users';

export const fetchDashboards = async (
  userId: string,
  accessToken: string,
): Promise<DocumentData[]> => {
  const response = await axios.get<DocumentData[]>(`${API_BASE_URL}/${userId}/dashboard`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.data;
};

export const uploadDashboardData = async (
  userId: string,
  accessToken: string,
  dashboardId: string,
  file: File,
): Promise<DocumentData> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('dashboardId', dashboardId);

  const response = await axios.post(`${API_BASE_URL}/${userId}/dashboard/upload`, formData, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.dashboard;
};

export const deleteDashboard = async (
  userId: string,
  accessToken: string,
  dashboardId: string,
): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/${userId}/dashboard/${dashboardId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
};

export const updateDashboardName = async (
  userId: string,
  accessToken: string,
  dashboardId: string,
  newName: string,
): Promise<DocumentData> => {
  const response = await axios.put(
    `${API_BASE_URL}/${userId}/dashboard/${dashboardId}`,
    { dashboardName: newName },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    },
  );
  return response.data.dashboard;
};

export const deleteDashboardFile = async (
  userId: string,
  accessToken: string,
  dashboardId: string,
  fileName: string,
): Promise<DocumentData> => {
  const response = await axios.delete(
    `${API_BASE_URL}/${userId}/dashboard/${dashboardId}/file/${fileName}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
  return response.data.dashboard;
};
