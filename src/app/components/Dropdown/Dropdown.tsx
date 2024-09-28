import React, { useState, useEffect, useRef } from 'react';
import classNames from 'classnames';
import { AiOutlineDown, AiOutlineUp } from 'react-icons/ai';
import { checkFileType } from '../../../../utils/fileTypeChecker';

interface Props {
  name: string;
  value?: File | null;
  items: File[];
  placeholder?: React.ReactNode;
  className?: string;
  onChange: (file: File) => void;
}

const Dropdown = (props: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedFile = props.value;

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionSelect = (file: File, event: React.MouseEvent<HTMLLIElement, MouseEvent>) => {
    event.stopPropagation();
    props.onChange(file);
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
    <div ref={dropdownRef} data-qa="dropdown" className={`relative ${props.className}`}>
      <div
        className={classNames(
          'paragraph-P1-regular flex h-[48px] w-[200px] cursor-pointer items-center justify-between border-[2px] border-primary-20 bg-gray-900 p-[21px] text-white',
          {
            'rounded-b-[0px] rounded-t-[20px]': isOpen,
            'rounded-full': !isOpen,
          },
        )}
        onClick={handleClick}
      >
        <div className="mr-[10px] flex items-center gap-[5px] truncate text-ellipsis text-white">
          {selectedFile ? checkFileType(selectedFile) : props.placeholder || 'Select a file'}
        </div>
        {isOpen ? <AiOutlineUp /> : <AiOutlineDown />}
      </div>

      {isOpen && (
        <ul
          data-qa="select-options"
          className="absolute z-50 max-h-60 w-full overflow-auto rounded-b-md border-x-[1px] border-b-[1px] border-x-primary-90 border-b-primary-90 bg-shades-white"
        >
          {props.items.map((file) => (
            <li
              key={file.name}
              className="paragraph-P1-regular z-50 mx-1 my-[5px] flex cursor-pointer items-center gap-[5px] truncate text-ellipsis rounded-[5px] px-3 py-2 hover:bg-gray-200"
              onClick={(e) => handleOptionSelect(file, e)}
            >
              {checkFileType(file)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Dropdown;
