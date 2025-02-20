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
import { AiOutlineUp, AiOutlineDown } from 'react-icons/ai';

/**
 * Props for the DataBar component.
 */
interface DataBarProps {
  /** Called whenever a new file is chosen locally, just to display the name somewhere. */
  getFileName: (name: string) => void;
  /** Sets loading state (spinner, etc.) in the parent. */
  isLoading: (loading: boolean) => void;
  /** The parent’s function to update the entire dashboard data. */
  getData: (data: DocumentData) => void;
  /** The current dashboard's ID (if any). */
  dashboardId?: string;
  /** List of files belonging to the current dashboard. */
  files: { filename: string; content: any }[];
  /** Existing dashboard names (to avoid duplicates on create). */
  existingDashboardNames: string[];
  /** Parent callback: after creating a new dashboard, pass it up. */
  onCreateDashboard: (dashboard: DocumentData) => void;
  /** The current dashboardData (for CSV/XLSX downloads). */
  existingDashboardData: DashboardCategory[];
  /** Called if you detect data differences from local file vs. existing data. */
  onDataDifferencesDetected: (differences: any, pendingFile: File) => void;
}

// Helper function to restructure data for CSV/Excel downloads.
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

const BACKEND_URL = 'http://localhost:3500';

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

  // Local file upload state.
  const [file, setFile] = useState<File | null>(null);
  const [uploadedFilesItems, setUploadedFilesItems] = useState<DropdownItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingUpload, setPendingUpload] = useState(false);
  const [selectedFileType, setSelectedFileType] = useState<string>('excel');

  // Build the local files dropdown from the provided "files" prop.
  useEffect(() => {
    if (files) {
      const fileItems = files.map((f) => ({
        id: f.filename,
        name: f.filename,
      }));
      setUploadedFilesItems(fileItems);
    }
  }, [files]);

  // ----------------------------
  // Local File Upload Logic
  // ----------------------------

  // Handler for local file selection.
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      getFileName(e.target.files[0].name);
    }
  };

  // Create a new Dashboard (if user has none).
  const handleDashboardCreate = async (dashboardName: string) => {
    if (!userId) return;
    try {
      const resp = await axios.post(
        `${BACKEND_URL}/data/users/${userId}/dashboard/create`,
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
      // If we had a pending file to upload, do it now:
      if (pendingUpload && file) {
        await handleUploadToDashboard(dashboard._id, file);
      }
    } catch (err: any) {
      console.error('Error creating dashboard:', err.response || err.message);
    } finally {
      setPendingUpload(false);
    }
  };

  // Upload a local file to the selected (or newly created) dashboard.
  const handleUploadToDashboard = async (dashId: string, localFile: File) => {
    isLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', localFile);
      formData.append('dashboardId', dashId);

      const resp = await axios.post(
        `${BACKEND_URL}/data/users/${userId}/dashboard/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'multipart/form-data',
          },
        },
      );
      // The server returns the entire updated "dashboard"
      const { dashboard } = resp.data;
      getData(dashboard); // update the parent with new data
      setFile(null);
    } catch (err) {
      console.error('Error uploading file:', err);
    } finally {
      isLoading(false);
    }
  };

  // Form submit for local file upload
  const handleLocalUploadSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;
    // If no dashboard selected, prompt the user to create one
    if (!dashboardId) {
      setPendingUpload(true);
      setIsModalOpen(true);
      return;
    }
    // Otherwise, upload directly
    await handleUploadToDashboard(dashboardId, file);
  };

  // ----------------------------
  // Google Cloud Data Logic
  // ----------------------------

  /**
   * Called by the <GoogleCloud> component whenever new cloud data is available.
   * The server has already updated the dashboard and returned the entire updated object.
   */
  const handleCloudData = (updatedDashboard: DocumentData) => {
    // If we do not have a dashboardId yet, we could prompt user to create one
    // but typically you'd attach the cloud data to an existing dashboard.
    // For simplicity, if there's no dashboard, prompt creation:
    if (!dashboardId) {
      setPendingUpload(true);
      setIsModalOpen(true);
      return;
    }

    // Otherwise, the server's returned updatedDashboard is already up to date
    getData(updatedDashboard);
  };

  // ----------------------------
  // CSV / Excel Download Logic
  // ----------------------------

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
    const s2ab = (s: string) => {
      const buf = new ArrayBuffer(s.length);
      const view = new Uint8Array(buf);
      for (let i = 0; i < s.length; i++) {
        view[i] = s.charCodeAt(i) & 0xff;
      }
      return buf;
    };
    const blob = new Blob([s2ab(wbout)], { type: 'application/octet-stream' });
    saveAs(blob, 'dashboard_data.xlsx');
  }

  // ----------------------------
  // Deleting Locally Uploaded File
  // ----------------------------
  const handleFileDelete = async (fileNameToDelete: string) => {
    if (!dashboardId || !userId) return;
    try {
      const resp = await axios.delete(
        `${BACKEND_URL}/data/users/${userId}/dashboard/${dashboardId}/file/${fileNameToDelete}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      const { dashboard } = resp.data;
      getData(dashboard);
    } catch (err) {
      console.error('Error deleting file:', err);
    }
  };

  // ----------------------------
  //  RENDER
  // ----------------------------
  return (
    <div className="relative hidden w-fit flex-col items-center justify-start rounded-2xl bg-gray-900 p-4 md:flex">
      {/* Modal for dashboard creation */}
      <DashboardNameModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setPendingUpload(false);
        }}
        onSubmit={handleDashboardCreate}
        existingDashboardNames={existingDashboardNames}
      />

      {/* The "Upload" form for local files */}
      <form
        className="flex w-[95%] flex-col items-center justify-center"
        onSubmit={handleLocalUploadSubmit}
      >
        <div className="flex w-[95%] items-center justify-center gap-6">
          {/* Local file input */}
          <input id="file" type="file" style={{ display: 'none' }} onChange={handleFileChange} />
          <label
            htmlFor="file"
            className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-lg bg-white p-2 hover:bg-gray-200"
          >
            <MdOutlineAttachFile size={25} />
          </label>

          {/* GoogleCloud component */}
          <GoogleCloud
            getData={getData}
            onCloudData={handleCloudData}
            dashboardId={dashboardId || ''}
          />

          {/* Dropdown of already-uploaded local files */}
          <Dropdown
            width="170px"
            items={uploadedFilesItems}
            onDelete={handleFileDelete}
            placeholder={file?.name ?? 'Uploaded Files'}
          />

          {/* "Upload" button for local file */}
          <Button type="secondary" htmlType="submit" disabled={!file}>
            Upload
          </Button>

          {/* Download CSV/XLSX */}
          <div className="z-20 flex h-12 cursor-pointer items-center gap-3 rounded-full border-2 border-white px-3 py-2 hover:bg-gray-700">
            <div
              className="paragraph-P1-regular flex items-center"
              onClick={() => {
                const restructured = restructureData(existingDashboardData);
                if (selectedFileType === 'csv') {
                  downloadCSV(restructured);
                } else {
                  downloadExcel(restructured);
                }
              }}
            >
              <IoMdDownload color="white" size={25} />
            </div>
            <div>
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
