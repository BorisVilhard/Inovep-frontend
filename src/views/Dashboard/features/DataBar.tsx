import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DocumentData, DashboardCategory } from '@/types/types';
import { MdOutlineAttachFile } from 'react-icons/md';
import Dropdown, { DropdownItem } from '@/app/components/Dropdown/Dropdown';
import Button from '@/app/components/Button/Button';
import { FaPlus } from 'react-icons/fa6';
import DashboardNameModal from '@/app/components/testModal/DashboardNameModal';
import useAuthStore from '@/views/auth/api/userReponse';

interface DataBarProps {
  getFileName: (name: string) => void;
  isLoading: (loading: boolean) => void;
  getData: (data: DocumentData) => void;
  dashboardId?: string;
  files: { filename: string; content: any }[];
  existingDashboardNames: string[];
  onCreateDashboard: (dashboard: DocumentData) => void;
  existingDashboardData: DashboardCategory[];
  onDataDifferencesDetected: (differences: any, pendingFile: File) => void; // New prop
}

const DataBar: React.FC<DataBarProps> = ({
  getFileName,
  isLoading,
  getData,
  dashboardId,
  files,
  existingDashboardNames,
  onCreateDashboard,
  existingDashboardData,
  onDataDifferencesDetected, // New prop
}) => {
  const [file, setFile] = useState<File | null>(null);
  const { id: userId, accessToken } = useAuthStore();
  const [uploadedFilesItems, setUploadedFilesItems] = useState<DropdownItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingUpload, setPendingUpload] = useState(false);

  useEffect(() => {
    if (files) {
      const fileItems = files.map((file) => ({
        id: file.filename,
        name: file.filename,
      }));
      setUploadedFilesItems(fileItems);
    }
  }, [files]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      getFileName(e.target.files[0].name);
    }
  };

  const handleDashboardCreate = async (dashboardName: string) => {
    if (!userId) return;
    try {
      const response = await axios.post(
        `http://localhost:3500/data/users/${userId}/dashboard/create`,
        { dashboardName },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const { dashboard } = response.data;
      onCreateDashboard(dashboard);

      if (pendingUpload && file) {
        await uploadFile(file, dashboard._id);
      }
    } catch (error: any) {
      console.error('Error creating dashboard:', error.response || error.message);
    } finally {
      setPendingUpload(false);
    }
  };

  const uploadFile = async (file: File, dashboardId?: string, dashboardName?: string) => {
    isLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    if (dashboardId) {
      formData.append('dashboardId', dashboardId);
    } else if (dashboardName) {
      formData.append('dashboardName', dashboardName);
    }

    try {
      const response = await axios.post(
        `http://localhost:3500/data/users/${userId}/dashboard/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      const { dashboard } = response.data;
      getData(dashboard);
      setFile(null);
    } catch (error) {
      console.error('Error uploading data:', error);
    } finally {
      isLoading(false);
    }
  };

  const compareData = (oldData: DashboardCategory[], newData: DashboardCategory[]) => {
    const differences = {
      addedCategories: [] as DashboardCategory[],
      removedCategories: [] as DashboardCategory[],
      addedTitles: [] as { category: string; titles: string[] }[],
      removedTitles: [] as { category: string; titles: string[] }[],
    };

    const oldCategories = new Set(oldData.map((cat) => cat.categoryName));
    const newCategories = new Set(newData.map((cat) => cat.categoryName));

    // Find added categories
    for (const newCat of newData) {
      if (!oldCategories.has(newCat.categoryName)) {
        differences.addedCategories.push(newCat);
      }
    }

    // Find removed categories
    for (const oldCat of oldData) {
      if (!newCategories.has(oldCat.categoryName)) {
        differences.removedCategories.push(oldCat);
      }
    }

    for (const newCat of newData) {
      const oldCat = oldData.find((cat) => cat.categoryName === newCat.categoryName);
      if (oldCat) {
        const oldTitles = new Set(oldCat.mainData.map((entry) => entry.id));
        const newTitles = new Set(newCat.mainData.map((entry) => entry.id));

        const addedTitles = [...newTitles].filter((id) => !oldTitles.has(id));
        const removedTitles = [...oldTitles].filter((id) => !newTitles.has(id));

        if (addedTitles.length > 0) {
          differences.addedTitles.push({
            category: newCat.categoryName,
            titles: addedTitles,
          });
        }

        if (removedTitles.length > 0) {
          differences.removedTitles.push({
            category: newCat.categoryName,
            titles: removedTitles,
          });
        }
      }
    }

    return differences;
  };

  const uploadData = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;

    if (!dashboardId) {
      setPendingUpload(true);
      setIsModalOpen(true);
      return;
    }

    isLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(
        `http://localhost:3500/data/users/${userId}/dashboard/processFile`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      const { dashboardData: newDashboardData } = response.data;

      const differences = compareData(existingDashboardData, newDashboardData);

      if (
        differences.addedCategories.length > 0 ||
        differences.removedCategories.length > 0 ||
        differences.addedTitles.length > 0 ||
        differences.removedTitles.length > 0
      ) {
        onDataDifferencesDetected(differences, file);
      } else {
        await uploadFile(file, dashboardId);
      }
    } catch (error) {
      console.error('Error processing file:', error);
    } finally {
      isLoading(false);
    }
  };

  const handleFileDelete = async (fileIdToDelete: string) => {
    if (!dashboardId || !userId) return;
    try {
      const response = await axios.delete(
        `http://localhost:3500/data/users/${userId}/dashboard/${dashboardId}/file/${fileIdToDelete}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const { dashboard } = response.data;
      getData(dashboard);
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  return (
    <div className="relative hidden w-fit flex-col items-center justify-start rounded-2xl bg-gray-900 px-[35px] py-[15px] md:flex">
      <DashboardNameModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setPendingUpload(false);
        }}
        onSubmit={handleDashboardCreate}
        existingDashboardNames={existingDashboardNames}
      />

      <form
        className="flex w-[95%] flex-col items-center justify-center gap-[20px]"
        onSubmit={uploadData}
      >
        <div className="flex w-[95%] items-center justify-center gap-[20px]">
          <input id="file" style={{ display: 'none' }} type="file" onChange={handleFileChange} />
          <label
            className="flex cursor-pointer items-center justify-center rounded-lg border-none bg-shades-white p-[11px] hover:bg-neutral-20"
            htmlFor="file"
          >
            <MdOutlineAttachFile size={25} />
          </label>
          <p className="w-[170px] truncate text-ellipsis text-shades-white underline">
            {file?.name ?? 'No File'}
          </p>
          <Button type="secondary" htmlType="submit">
            Upload
          </Button>
          <Dropdown
            className="w-[250px]"
            items={uploadedFilesItems}
            onDelete={handleFileDelete}
            placeholder="Select or Remove File"
          />

          <Button
            type="secondary"
            className="gap-2"
            htmlType="button"
            onClick={() => {
              setIsModalOpen(true);
            }}
          >
            Dashboard <FaPlus />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DataBar;
