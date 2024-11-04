import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as zod from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

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
    <div className="modal">
      <form onSubmit={handleSubmit(onSubmitHandler)}>
        <input
          {...register('dashboardName')}
          placeholder="Dashboard Name"
          defaultValue={initialName}
        />
        {errors.dashboardName && <p>{errors.dashboardName.message}</p>}
        <button type="submit">Save</button>
        <button type="button" onClick={onClose}>
          Cancel
        </button>
      </form>
    </div>
  );
};

export default DashboardNameModal;
