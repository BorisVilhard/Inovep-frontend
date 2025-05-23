import React, { useState, useEffect, useRef, ReactNode } from 'react';
import classNames from 'classnames';
import { AiOutlineDown, AiOutlineUp } from 'react-icons/ai';
import EditDropdownItem from './EditDropDownItem';
import { MdDelete } from 'react-icons/md';

export interface DropdownItem {
  id: string;
  name: ReactNode;
}

interface Props {
  items: DropdownItem[];
  placeholder?: string;
  className?: string;
  onSelect?: (id: string) => void;
  selectedId?: string;
  type?: 'primary' | 'secondary';
  size?: 'small' | 'large';
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  width?: string;
  /** 
   * Optional key for storing the selected ID in localStorage. 
   * If not provided, no localStorage is used.
   */
  localStorageKey?: string; 
}

const Dropdown: React.FC<Props> = ({
  items,
  placeholder = 'Select an item',
  className,
  onSelect,
  selectedId,
  type = 'primary',
  size = 'small',
  onEdit,
  onDelete,
  width,
  localStorageKey,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItemName, setSelectedItemName] = useState<ReactNode>(placeholder);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [hoveredItemId, setHoveredItemId] = useState<string>();


  useEffect(() => {
    if (!selectedId && localStorageKey) {
      const storedId = localStorage.getItem(localStorageKey);
      if (storedId) {
        onSelect?.(storedId);
      }
    }
  }, []);


  useEffect(() => {
    if (selectedId) {
      const selectedItem = items.find((item) => item.id === selectedId);
      if (selectedItem) {
        setSelectedItemName(selectedItem.name);
      }
    } else {
      setSelectedItemName(placeholder);
    }
  }, [selectedId, items, placeholder]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  // --------------------------------
  // When user selects, store if we have a localStorageKey
  // --------------------------------
  const handleSelect = (id: string) => {
    if (localStorageKey) {
      localStorage.setItem(localStorageKey, id);
    }
    onSelect?.(id);
    setIsOpen(false);
  };

  // Close if user clicks outside
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
    <div ref={dropdownRef} data-qa="dropdown" className={`relative ${className || ''} ${width || ''}`}>
      {/* Dropdown trigger */}
      <div
        style={{ width }}
        className={classNames(
          'paragraph-P1-regular flex h-[48px] cursor-pointer items-center justify-between border-[2px]',
          {
            'rounded-b-[0px] rounded-t-[20px]': isOpen,
            'rounded-full': !isOpen,
            'border-primary-20 bg-gray-900 p-[12px] text-white': type === 'primary',
            'border-none bg-shades-white p-[12px] text-shades-black': type === 'secondary',
          }
        )}
        onClick={handleToggle}
      >
        <div
          style={{ width }}
          className={classNames('mr-[10px] flex w-full items-center gap-[5px] truncate', {
            'text-white': type === 'primary',
            'text-shades-black': type === 'secondary',
            'text-[20px]': size === 'large',
          })}
        >
          {selectedItemName}
        </div>
        {isOpen ? <AiOutlineUp /> : <AiOutlineDown />}
      </div>

      {/* Dropdown menu items */}
      {isOpen && (
        <ul
          data-qa="select-options"
          className={classNames(
            'max-h-50 absolute z-50 overflow-auto border-x-primary-90 border-b-primary-90 bg-shades-white',
            {
              'w-full rounded-b-md border-x-[1px] border-b-[1px]': size === 'small',
              'left-1/2 w-[50vw] -translate-x-1/2 transform rounded border-[1px]': size === 'large',
            }
          )}
        >
          {items.map((item) =>
            onEdit && onDelete && onSelect ? (
              <EditDropdownItem
                key={item.id}
                item={item}
                isSelected={item.id === selectedId}
                onSelect={onSelect}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ) : onDelete ? (
              <li
                key={item.id}
                className="paragraph-P1-regular relative z-50 mx-1 my-[5px] flex cursor-pointer items-center gap-[5px] rounded-[5px] px-3 py-2 hover:bg-gray-200"
                onClick={() => onDelete(item.id)}
                onMouseEnter={() => setHoveredItemId(item.id)}
                onMouseLeave={() => setHoveredItemId(undefined)}
              >
                {hoveredItemId === item.id && (
                  <button className="absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 transform text-[20px] text-red-500 hover:text-red-700">
                    <MdDelete />
                  </button>
                )}
                <span className="flex-1 truncate">{item.name}</span>
              </li>
            ) : (
              <li
                key={item.id}
                className="paragraph-P1-regular z-50 mx-1 my-[5px] flex cursor-pointer items-center gap-[5px] rounded-[5px] px-3 py-2 hover:bg-gray-200"
                onClick={() => handleSelect(item.id)}
              >
                <span className="flex-1 truncate">{item.name}</span>
              </li>
            )
          )}
        </ul>
      )}
    </div>
  );
};

export default Dropdown;
