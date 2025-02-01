'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

import { DocumentData, DashboardCategory } from '@/types/types';
import { MdOutlineAttachFile } from 'react-icons/md';
import Toggle from '@/app/components/Toggle/Toggle';
import Button from '@/app/components/Button/Button';
import { FaPlus } from 'react-icons/fa6';
import DashboardNameModal from '@/app/components/testModal/DashboardNameModal';
import useAuthStore from '@/views/auth/api/userReponse';

import { IoMdDownload } from 'react-icons/io';
import { GrDocumentExcel } from 'react-icons/gr';
import { BsFiletypeCsv } from 'react-icons/bs';
import Dropdown, { DropdownItem } from '@/app/components/Dropdown/Dropdown';
import GoogleCloud from '@/app/components/testModal/GoogleCloud';

interface DataBarProps {
  getFileName: (name: string) => void;
  isLoading: (loading: boolean) => void;
  getData: (data: DocumentData) => void;
  dashboardId?: string;
  files: { filename: string; content: any }[];
  existingDashboardNames: string[];
  onCreateDashboard: (dashboard: DocumentData) => void;
  existingDashboardData: DashboardCategory[];
  onDataDifferencesDetected: (differences: any, pendingFile: File) => void;
}

function restructureData(dashboardData: DashboardCategory[]) {
  const finalData: {
    dashboardData: {
      categoryName: string;
      data: { title: string; value: number | string }[];
    }[];
  } = {
    dashboardData: [],
  };

  dashboardData.forEach((category) => {
    const titleMap = new Map<string, (number | string)[]>();

    category.mainData.forEach((mainItem) => {
      mainItem.data.forEach((entry) => {
        if (!titleMap.has(entry.title)) {
          titleMap.set(entry.title, []);
        }
        titleMap.get(entry.title)?.push(entry.value);
      });
    });

    const aggregatedData: { title: string; value: number | string }[] = [];
    titleMap.forEach((values, title) => {
      const allNumbers = values.every((v) => typeof v === 'number');
      if (allNumbers) {
        const sum = (values as number[]).reduce((acc, val) => acc + val, 0);
        aggregatedData.push({ title, value: sum });
      } else {
        // If mixed or string, just take the first string
        const firstString = values.find((v) => typeof v === 'string') || '';
        aggregatedData.push({ title, value: firstString });
      }
    });

    finalData.dashboardData.push({
      categoryName: category.categoryName,
      data: aggregatedData,
    });
  });

  return finalData;
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
  onDataDifferencesDetected,
}) => {
  const { id: userId, accessToken } = useAuthStore();

  const [file, setFile] = useState<File | null>(null);
  const [uploadedFilesItems, setUploadedFilesItems] = useState<DropdownItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingUpload, setPendingUpload] = useState(false);
  const [selectedFileType, setSelectedFileType] = useState<string>('excel');

  // Build Dropdown items from `files` (so we can display existing file names)
  useEffect(() => {
    if (files) {
      const fileItems = files.map((f) => ({
        id: f.filename,
        name: f.filename,
      }));
      setUploadedFilesItems(fileItems);
    }
  }, [files]);

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      getFileName(e.target.files[0].name);
    }
  };

  // CSV download
  function downloadCSV(restructured: ReturnType<typeof restructureData>) {
    let csv = 'categoryName,title,value\n';
    restructured.dashboardData.forEach((cat) => {
      cat.data.forEach((item) => {
        csv += `${cat.categoryName},${item.title},${item.value}\n`;
      });
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'dashboard_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Excel download
  function downloadExcel(restructured: ReturnType<typeof restructureData>) {
    const sheetData = [['categoryName', 'title', 'value']];
    restructured.dashboardData.forEach((cat) => {
      cat.data.forEach((item) => {
        sheetData.push([cat.categoryName, item.title, item.value as string]);
      });
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(wb, ws, 'DashboardData');

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
    function s2ab(s: string) {
      const buf = new ArrayBuffer(s.length);
      const view = new Uint8Array(buf);
      for (let i = 0; i < s.length; i++) {
        view[i] = s.charCodeAt(i) & 0xff;
      }
      return buf;
    }
    const blob = new Blob([s2ab(wbout)], { type: 'application/octet-stream' });
    saveAs(blob, 'dashboard_data.xlsx');
  }

  // Create a new Dashboard (step if user doesn't have a dashboard yet)
  const handleDashboardCreate = async (dashboardName: string) => {
    if (!userId) return;
    try {
      const resp = await axios.post(
        `http://localhost:3500/data/users/${userId}/dashboard/create`,
        { dashboardName },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );
      const { dashboard } = resp.data;
      onCreateDashboard(dashboard);

      // If user had selected a file prior to creation, we can auto-upload
      if (pendingUpload && file) {
        await handleUploadToDashboard(dashboard._id, file);
      }
    } catch (err: any) {
      console.error('Error creating dashboard:', err.response || err.message);
    } finally {
      setPendingUpload(false);
    }
  };

  /**
   * The main function that uploads (merges) a file to the provided dashboard.
   */
  const handleUploadToDashboard = async (dashId: string, localFile: File) => {
    isLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', localFile);
      // Pass it in the body as well
      formData.append('dashboardId', dashId);

      const resp = await axios.post(
        `http://localhost:3500/data/users/${userId}/dashboard/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'multipart/form-data',
          },
        },
      );
      const { dashboard } = resp.data;
      getData(dashboard);
      setFile(null);
    } catch (err) {
      console.error('Error uploading file:', err);
    } finally {
      isLoading(false);
    }
  };

  // Form submit => tries to upload local file directly to the existing dashboard
  const handleLocalUploadSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;

    // If there's no dashboard, prompt creation (modal)
    if (!dashboardId) {
      setPendingUpload(true); // let handleDashboardCreate know we owe an upload
      setIsModalOpen(true);
      return;
    }

    // We have an existing dashboard => upload directly
    await handleUploadToDashboard(dashboardId, file);
  };

  // Called by GoogleCloud component if user picks new data
  const handleCloudData = async (fileName: string, newDashboardData: DashboardCategory[]) => {
    // If no dashboard => ask user to create
    if (!dashboardId) {
      setPendingUpload(true);
      setIsModalOpen(true);
      // The actual storing will happen in handleDashboardCreate -> uploadCloudData
      return;
    }
    // Otherwise, merge with DB
    await uploadCloudData(fileName, newDashboardData, dashboardId);
  };

  // Merge cloud data with DB
  const uploadCloudData = async (
    fileName: string,
    dashboardData: DashboardCategory[],
    dashId?: string,
  ) => {
    isLoading(true);
    try {
      const resp = await axios.post(
        `http://localhost:3500/data/users/${userId}/dashboard/uploadCloud`,
        {
          dashboardId: dashId,
          fileName,
          dashboardData,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      const { dashboard } = resp.data;
      getData(dashboard);
    } catch (err) {
      console.error('Error uploading cloud data:', err);
    } finally {
      isLoading(false);
    }
  };

  // Delete a file from the dropdown
  const handleFileDelete = async (fileNameToDelete: string) => {
    if (!dashboardId || !userId) return;
    try {
      const resp = await axios.delete(
        `http://localhost:3500/data/users/${userId}/dashboard/${dashboardId}/file/${fileNameToDelete}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      const { dashboard } = resp.data;
      getData(dashboard);
    } catch (err) {
      console.error('Error deleting file:', err);
    }
  };

  // Download CSV or Excel
  const handleDownload = () => {
    const restructured = restructureData(existingDashboardData);
    if (selectedFileType === 'csv') {
      downloadCSV(restructured);
    } else {
      downloadExcel(restructured);
    }
  };

  return (
    <div className="relative hidden w-fit flex-col items-center justify-start rounded-2xl bg-gray-900 p-[15px] md:flex">
      {/* Modal for creating a dashboard if none exist yet */}
      <DashboardNameModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setPendingUpload(false);
        }}
        onSubmit={handleDashboardCreate}
        existingDashboardNames={existingDashboardNames}
      />

      {/* The "Upload" form */}
      <form
        className="flex w-[95%] flex-col items-center justify-center"
        onSubmit={handleLocalUploadSubmit}
      >
        <div className="flex w-[95%] items-center justify-center gap-[22px]">
          {/* Local file input */}
          <input id="file" type="file" style={{ display: 'none' }} onChange={handleFileChange} />
          <label
            htmlFor="file"
            className="flex h-[43px] w-[43px] cursor-pointer items-center justify-center
                       rounded-lg border-none bg-shades-white p-[11px] hover:bg-neutral-20"
          >
            <MdOutlineAttachFile size={25} />
          </label>

          {/* GoogleCloud => picks data from GDrive, merges automatically */}
          <GoogleCloud
            getData={(tempDoc) => {
              // optional preview or local usage
            }}
            onCloudData={handleCloudData}
            dashboardId={dashboardId || ''}
          />

          {/* Dropdown with existing files for this dashboard */}
          <Dropdown
            width="170px"
            items={uploadedFilesItems}
            onDelete={handleFileDelete}
            placeholder={file?.name ?? 'Uploaded Files'}
          />

          {/* "Upload" button for local files */}
          <Button type="secondary" htmlType="submit" disabled={!file}>
            Upload
          </Button>

          {/* Download CSV/XLSX */}
          <div
            className="z-20 flex h-[48px] cursor-pointer items-center gap-3
                       rounded-full border-[2px] border-solid border-white
                       px-[7px] py-[2px] hover:bg-gray-700"
          >
            <div className="paragraph-P1-regular z-20 flex items-center" onClick={handleDownload}>
              <IoMdDownload color="white" size={25} />
            </div>
            <div className="z-20">
              <Toggle
                initialState={selectedFileType === 'excel'}
                onToggle={(state) => setSelectedFileType(state ? 'excel' : 'csv')}
                children1={
                  <div className="flex items-center gap-1">
                    Excel <GrDocumentExcel size={20} />
                  </div>
                }
                children2={
                  <div className="flex items-center gap-1">
                    <BsFiletypeCsv size={20} /> CSV
                  </div>
                }
                className="ml-2"
              />
            </div>
          </div>

          {/* Create New Dashboard Button */}
          <Button
            type="secondary"
            className="gap-2"
            htmlType="button"
            onClick={() => setIsModalOpen(true)}
          >
            Dashboard <FaPlus />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DataBar;
