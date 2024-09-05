// Switcher.jsx
import classNames from 'classnames';
import React, { Children } from 'react';

interface SwitcherItemProps {
  children: React.ReactNode;
}

const SwitcherItem: React.FC<SwitcherItemProps> = ({ children }) => {
  return <div>{children}</div>;
};

interface SwitcherProps {
  children: React.ReactNode;
  activeIndex: number;
}

interface SwitcherComponent extends React.FC<SwitcherProps> {
  Item: typeof SwitcherItem;
}

const Switcher: SwitcherComponent = ({ children, activeIndex }) => {
  const childArray = Children.toArray(children);

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="mb-5 flex items-center gap-3">
        {childArray.map((_, index) => (
          <div
            key={index}
            className={classNames('h-[15px] w-[80px] cursor-pointer rounded-full', {
              'bg-primary-90': index !== activeIndex,
              'bg-blue-200': index === activeIndex,
            })}
          />
        ))}
      </div>
      <div className="w-full">
        {React.isValidElement<SwitcherItemProps>(childArray[activeIndex]) &&
          childArray[activeIndex]}
      </div>
    </div>
  );
};

Switcher.Item = SwitcherItem;

export default Switcher;
