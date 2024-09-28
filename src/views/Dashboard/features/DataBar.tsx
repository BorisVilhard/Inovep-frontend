// DataBar.jsx
import React, { useState } from 'react';
import Dropdown from '@/app/components/Dropdown/Dropdown';
import { MdOutlineAttachFile } from 'react-icons/md';
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

    const formData = new FormData();
    formData.append('file', file);

    try {
      isLoading(true);
      getFileName(file.name);

      const response = await fetch('http://localhost:3500/documentProcess', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        console.error('Network response was not ok', response.statusText);
        return;
      }

      const data = await response.json();
      console.log('Data from backend:', data);

      const parsedData = typeof data === 'string' ? JSON.parse(data) : data;

      getData(parsedData);
    } catch (error) {
      console.error('Error fetching:', error);
    } finally {
      isLoading(false);
    }
  };

  return (
    <div className="relative flex w-fit flex-col items-center justify-start rounded-2xl bg-gray-900 px-[85px] py-[15px]">
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
            <a className="flex items-center text-[25px]">
              <MdOutlineAttachFile />
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
      </form>
    </div>
  );
};

export default DataBar;
