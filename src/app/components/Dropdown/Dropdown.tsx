'use client';
import classNames from 'classnames';
import React, { ReactNode, useMemo, useState, useEffect, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import Button from '../Button/Button';
import { AiOutlineDown, AiOutlineUp } from 'react-icons/ai';

interface Props {
  name: string;
  value?: string;
  items: { icon?: ReactNode; label: string; value: string }[];
  placeholder?: ReactNode;
  className?: string;
  onChange: (value: string) => void;
}

const Dropdown = (props: Props) => {
  // const { setValue } = useFormContext();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string>(props.value || '');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleClick = () => {
    setIsOpen(!isOpen);
  };
  const handleOptionSelect = (
    option: { icon?: ReactNode; label: string; value: string },
    event: React.MouseEvent<HTMLLIElement, MouseEvent>,
  ) => {
    event.stopPropagation();
    setSelectedOption(option.value);
    setIsOpen(false);
    props.onChange(option.value);
    // setValue(props.name, option.value, { shouldValidate: true });
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

  const activeOption = useMemo(() => {
    return props.items.find((e) => e.value === selectedOption);
  }, [props.items, selectedOption]);

  return (
    <div ref={dropdownRef} data-qa="dropdown" className={`relative ${props.className}`}>
      <div
        className={classNames(
          'paragraph-P1-regular flex h-[48px] w-full cursor-pointer items-center justify-between border-[2px] border-primary-20 px-[15px] py-[11px] text-neutral-90',
          {
            'rounded-b-[1px] rounded-t-[10px]': isOpen,
            rounded: !isOpen,
          },
        )}
        onClick={handleClick}
      >
        <div className="flex items-center gap-[5px]">
          {activeOption?.icon}
          {activeOption?.label}
          {!activeOption && props.items[0].icon}
          {!activeOption && props.items[0].label}
        </div>
        {isOpen ? <AiOutlineUp /> : <AiOutlineDown />}
      </div>

      {isOpen && (
        <ul
          data-qa="select-options"
          className="absolute z-50 max-h-60 w-full overflow-auto rounded-b-md border-x-[1px] border-b-[1px] border-x-primary-90 border-b-primary-90 bg-shades-white"
        >
          {props.items.map((option) => (
            <li
              key={option.value}
              className="paragraph-P1-regular z-50 mx-1 my-[5px] flex cursor-pointer items-center gap-[5px] rounded-[5px] px-3 py-2 hover:bg-primary-10 hover:font-bold"
              onClick={(e) => handleOptionSelect(option, e)}
            >
              {option.icon} {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Dropdown;
