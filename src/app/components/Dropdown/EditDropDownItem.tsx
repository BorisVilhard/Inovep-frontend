import React, { ReactNode } from 'react';
import { MdDelete } from 'react-icons/md';

export interface CustomDropdownItem {
  id: string;
  name: ReactNode;
}

interface DropdownItemProps {
  item: CustomDropdownItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const EditDropdownItem: React.FC<DropdownItemProps> = ({
  item,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}) => {
  return (
    <div
      className={`flex cursor-pointer items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${
        isSelected ? 'bg-gray-100' : ''
      }`}
      onClick={() => onSelect(item.id)}
    >
      <span className="flex-grow">{item.name}</span>
      <button
        className="mr-2 text-blue-500 hover:text-blue-700"
        onClick={(e) => {
          e.stopPropagation();
          onEdit(item.id);
        }}
      >
        Edit
      </button>
      <button
        className="text-[20px] text-red-500 hover:text-red-700"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(item.id);
        }}
      >
        <MdDelete />
      </button>
    </div>
  );
};

export default EditDropdownItem;
