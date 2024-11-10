// components/DashboardNameModal.tsx

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as zod from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '../Button/Button';

interface DashboardNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
  existingDashboardNames: string[];
  initialName?: string;
}

const DashboardNameModal: React.FC<DashboardNameModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  existingDashboardNames,
  initialName,
}) => {
  const dashboardNameSchema = zod.object({
    dashboardName: zod
      .string()
      .min(1, 'Dashboard name is required')
      .refine((value) => !existingDashboardNames.includes(value), {
        message: 'Dashboard name already exists',
      }),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(dashboardNameSchema),
    defaultValues: { dashboardName: initialName || '' },
  });

  useEffect(() => {
    if (initialName) {
      reset({ dashboardName: initialName });
    }
  }, [initialName, reset]);

  const onSubmitHandler = (data: { dashboardName: string }) => {
    onSubmit(data.dashboardName);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="flex h-[38%] w-[38%] flex-col justify-between rounded-[30px] bg-white p-10 shadow-lg ">
        <h2 className="mb-4 text-2xl font-semibold">{initialName ? 'Edit' : 'Create'} Dashboard</h2>
        <form
          className="mt-[30px] flex h-full flex-col justify-between"
          onSubmit={handleSubmit(onSubmitHandler)}
        >
          <div className="mb-4">
            <label className="block text-gray-700">Dashboard Name</label>
            <input
              {...register('dashboardName')}
              className="w-full rounded border px-3 py-2"
              placeholder="Dashboard Name"
            />
            {errors.dashboardName && (
              <p className="mt-1 text-sm text-red-500">{errors.dashboardName.message}</p>
            )}
          </div>
          <div className="flex justify-end space-x-4">
            <Button
              htmlType="button"
              className="rounded bg-gray-300 px-4 py-2"
              onClick={() => {
                reset();
                onClose();
              }}
            >
              Cancel
            </Button>
            <Button htmlType="submit" className="rounded bg-blue-500 px-4 py-2 text-white">
              Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DashboardNameModal;
