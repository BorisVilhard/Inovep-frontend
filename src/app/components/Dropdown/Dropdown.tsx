// Dropdown.tsx

import React, { useState, useEffect, useRef } from 'react';
import classNames from 'classnames';
import { AiOutlineDown, AiOutlineUp } from 'react-icons/ai';

export interface DropdownItem {
  id: string;
  name: string;
}

interface Props {
  items: DropdownItem[];
  placeholder?: string;
  className?: string;
  onSelect?: (id: string) => void;
  selectedId?: string;
  type?: 'primary' | 'secondary';
  size?: 'small' | 'large';
}

const Dropdown: React.FC<Props> = ({
  items,
  placeholder = 'Select an item',
  className,
  onSelect,
  selectedId,
  type = 'primary',
  size = 'small',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItemName, setSelectedItemName] = useState<string>(placeholder);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedId) {
      const selectedItem = items.find((item) => item.id === selectedId);
      if (selectedItem) {
        setSelectedItemName(selectedItem.name);
      }
    }
  }, [selectedId, items]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleSelect = (id: string) => {
    if (onSelect) {
      onSelect(id);
    }
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={dropdownRef} data-qa="dropdown" className={`relative  ${className}`}>
      <div
        className={classNames(
          'paragraph-P1-regular flex h-[48px] cursor-pointer items-center justify-between border-[2px] ',
          {
            'rounded-b-[0px] rounded-t-[20px]': isOpen,
            'rounded-full': !isOpen,
            'border-primary-20 bg-gray-900 p-[12px] text-white': type === 'primary',
            'border-none bg-shades-white p-[12px] text-shades-black': type === 'secondary',
          },
        )}
        onClick={handleToggle}
      >
        <div
          className={classNames('mr-[10px] flex items-center gap-[5px] truncate text-ellipsis', {
            'text-white': type === 'primary',
            'text-shades-black': type === 'secondary',
            'text-[20px]': size === 'large',
          })}
        >
          {selectedItemName}
        </div>
        {isOpen ? <AiOutlineUp /> : <AiOutlineDown />}
      </div>

      {isOpen && (
        <ul
          data-qa="select-options"
          className={classNames(
            'absolute z-50 max-h-60 overflow-auto border-x-primary-90 border-b-primary-90  bg-shades-white',
            {
              'w-full rounded-b-md border-x-[1px] border-b-[1px] border-x-primary-90 border-b-primary-90':
                size === 'small',
              'left-1/2 w-[50vw] -translate-x-1/2 transform rounded border-[1px] border-primary-90':
                size === 'large',
            },
          )}
        >
          {items.map((item) => (
            <li
              key={item.id}
              className="paragraph-P1-regular z-50 mx-1 my-[5px] flex cursor-pointer items-center gap-[5px] rounded-[5px] px-3 py-2 hover:bg-gray-200"
              onClick={() => handleSelect(item.id)}
            >
              <span className="flex-1 truncate text-ellipsis">{item.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Dropdown;
