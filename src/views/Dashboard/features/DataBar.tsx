import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DocumentData } from '@/types/types';
import useStore from '@/views/auth/api/userReponse';
import { MdOutlineAttachFile } from 'react-icons/md';
import Dropdown, { DropdownItem } from '@/app/components/Dropdown/Dropdown';
import Button from '@/app/components/Button/Button';
import { FaPlus } from 'react-icons/fa6';
import DashboardNameModal from '@/app/components/testModal/TestModal';

interface DataBarProps {
  getFileName: (name: string) => void;
  isLoading: (loading: boolean) => void;
  getData: (data: DocumentData) => void;
  dashboardId?: string;
  files: { filename: string; content: any }[];
  existingDashboardNames: string[];
  onCreateDashboard: (dashboard: DocumentData) => void;
}

const DataBar: React.FC<DataBarProps> = ({
  getFileName,
  isLoading,
  getData,
  dashboardId,
  files,
  existingDashboardNames,
  onCreateDashboard,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const { id: userId, accessToken } = useStore();
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

  const uploadData = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;

    if (!dashboardId) {
      setPendingUpload(true);
      setIsModalOpen(true);
      return;
    }

    await uploadFile(file, dashboardId);
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
    <div className="relative flex w-fit flex-col items-center justify-start rounded-2xl bg-gray-900 px-[35px] py-[15px]">
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
