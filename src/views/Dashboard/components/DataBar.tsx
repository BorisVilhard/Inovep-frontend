import React, { useState } from 'react';
import Dropdown from '@/app/components/Dropdown/Dropdown';
import { GoUpload } from 'react-icons/go';
import { DocumentData } from '@/types/types';
import Button from '@/app/components/Button/Button';
import { FaPlus } from 'react-icons/fa6';

interface Props {
  getData: (data: DocumentData) => void;
  isLoading: (loading: boolean) => void;
  getFileName: (name: string) => void;
}

const DataBar = ({ getData, isLoading, getFileName }: Props) => {
  const [file, setFile] = useState<File | null>(null);
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) return alert('Please select a file!');

    isLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    getFileName(file.name);
    try {
      const response = await fetch('http://127.0.0.1:5000/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      getData(data.data);
    } catch (error) {
      console.error('Error fetching:', error);
    } finally {
      isLoading(false);
    }
  };

  return (
    <div className="relative mb-5 flex w-full flex-col items-center justify-start px-[25px] py-[15px]">
      <h1 className="mb-[30px] text-[20px] font-bold">Filex.excel</h1>
      <form
        className="flex w-[95%] flex-col items-center justify-center gap-[20px]"
        onSubmit={handleSubmit}
      >
        <div className="flex w-[95%] items-center justify-center gap-[20px]">
          <input
            id={'file'}
            style={{ display: 'none' }}
            type="file"
            onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
          />
          <label
            className="flex cursor-pointer items-center justify-center rounded-lg border-none bg-shades-white p-[11px] hover:bg-neutral-20"
            htmlFor={'file'}
          >
            <a className="flex items-center text-[20px]">
              <GoUpload />
            </a>
          </label>
          <Dropdown
            name="mediaType"
            className="w-[250px]"
            items={[
              { label: 'Video', value: 'video' },
              { label: 'Image', value: 'image' },
            ]}
            onChange={() => {}}
          />
          <Button type="secondary" htmlType="submit">
            submit
          </Button>
          <Button type="secondary" className="gap-2" htmlType="submit">
            dashboard <FaPlus />
          </Button>
        </div>
        {file?.name && (
          <h1 className="mt-[14px] text-[14px] text-shades-white">Selected file: {file.name}</h1>
        )}
      </form>
    </div>
  );
};

export default DataBar;
