// Dropdown.tsx

import React, { useState, useEffect, useRef } from 'react';
import classNames from 'classnames';
import { AiOutlineDown, AiOutlineUp } from 'react-icons/ai';

export interface DropdownItem {
  id: string;
  name: string;
}

interface Props {
  name: string;
  items: DropdownItem[]; // Array of items with id and name
  placeholder?: string;
  className?: string;
  onSelect?: (id: string) => void; // Function to handle selection
}

const Dropdown: React.FC<Props> = ({
  name,
  items,
  placeholder = 'Select an item',
  className,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    <div ref={dropdownRef} data-qa="dropdown" className={`relative ${className}`}>
      <div
        className={classNames(
          'paragraph-P1-regular flex h-[48px] w-full cursor-pointer items-center justify-between border-[2px] border-primary-20 bg-gray-900 p-[12px] text-white',
          {
            'rounded-b-[0px] rounded-t-[20px]': isOpen,
            'rounded-full': !isOpen,
          },
        )}
        onClick={handleToggle}
      >
        <div className="mr-[10px] flex items-center gap-[5px] truncate text-ellipsis text-white">
          {placeholder}
        </div>
        {isOpen ? <AiOutlineUp /> : <AiOutlineDown />}
      </div>

      {isOpen && (
        <ul
          data-qa="select-options"
          className="absolute z-50 max-h-60 w-full overflow-auto rounded-b-md border-x-[1px] border-b-[1px] border-x-primary-90 border-b-primary-90 bg-shades-white"
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
