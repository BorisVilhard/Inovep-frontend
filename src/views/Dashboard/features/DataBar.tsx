// DataBar.tsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DocumentData } from '@/types/types';
import useStore from '@/views/auth/api/userReponse';
import { MdOutlineAttachFile } from 'react-icons/md';
import Dropdown, { DropdownItem } from '@/app/components/Dropdown/Dropdown';
import Button from '@/app/components/Button/Button';
import { FaPlus } from 'react-icons/fa6';

interface DataBarProps {
  getFileName: (name: string) => void;
  isLoading: (loading: boolean) => void;
  getData: (data: DocumentData) => void;
  DashboardId?: string;
  files: { filename: string; content: any }[];
}

const DataBar: React.FC<DataBarProps> = ({
  getFileName,
  isLoading,
  getData,
  DashboardId,
  files,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const { id: userId, accessToken } = useStore();
  const [uploadedFilesItems, setUploadedFilesItems] = useState<DropdownItem[]>([]);

  useEffect(() => {
    if (files) {
      const fileItems = files.map((file) => ({
        id: file.filename, // Use filename as id (ensure filenames are unique)
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

  const uploadData = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;

    isLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    if (DashboardId) {
      formData.append('dashboardId', DashboardId);
    }

    try {
      const response = await axios.post(
        `http://localhost:3500/data/users/${userId}/dashboard`,
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
      setFile(null); // Reset file input
    } catch (error) {
      console.error('Error uploading data:', error);
    } finally {
      isLoading(false);
    }
  };

  const handleFileDelete = async (fileIdToDelete: string) => {
    if (!DashboardId || !userId) return;
    try {
      const response = await axios.delete(
        `http://localhost:3500/data/users/${userId}/dashboard/${DashboardId}/file/${fileIdToDelete}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const { dashboard } = response.data;
      getData(dashboard);
      // No need to manually update uploadedFilesItems; it will update via useEffect when `files` prop changes.
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  return (
    <div className="relative flex w-fit flex-col items-center justify-start rounded-2xl bg-gray-900 px-[85px] py-[15px]">
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
            <a className="flex items-center text-[25px]">
              <MdOutlineAttachFile />
            </a>
          </label>

          {/* Dropdown to display and delete uploaded files */}
          <Dropdown
            name="uploadedFiles"
            className="w-[250px]"
            items={uploadedFilesItems}
            onSelect={handleFileDelete}
            placeholder="Click to remove file"
          />

          <Button type="secondary" htmlType="submit">
            Upload
          </Button>
          <Button type="secondary" className="gap-2" htmlType="button">
            Dashboard <FaPlus />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DataBar;
