// DashboardNameModal.tsx

import React, { useState } from 'react';

interface DashboardNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dashboardName: string) => void;
  existingDashboardNames: string[];
}

const DashboardNameModal: React.FC<DashboardNameModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  existingDashboardNames,
}) => {
  const [dashboardName, setDashboardName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!dashboardName) {
      setError('Dashboard name is required');
      return;
    }
    if (existingDashboardNames.includes(dashboardName)) {
      setError('Dashboard name already exists');
      return;
    }
    onSubmit(dashboardName);
    setDashboardName('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="rounded-lg bg-white p-6">
        <h2 className="mb-4 text-xl font-semibold">Create New Dashboard</h2>
        <input
          type="text"
          value={dashboardName}
          onChange={(e) => setDashboardName(e.target.value)}
          placeholder="Enter dashboard name"
          className="w-full rounded border px-3 py-2"
        />
        {error && <p className="mt-2 text-red-500">{error}</p>}
        <div className="mt-4 flex justify-end space-x-2">
          <button onClick={onClose} className="rounded bg-gray-300 px-4 py-2 hover:bg-gray-400">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardNameModal;
