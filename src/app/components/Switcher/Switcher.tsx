import React, { ReactNode, useState, useEffect, Children, ReactElement } from 'react';

interface SwitcherItemProps {
  label: string;
  children: ReactNode;
}

const SwitcherItem: React.FC<SwitcherItemProps> = () => null;

interface SwitcherProps {
  children: ReactNode;
  activeChildren?: (child: ReactNode) => void;
}

interface SwitcherComponent extends React.FC<SwitcherProps> {
  Item: typeof SwitcherItem;
}

const Switcher: SwitcherComponent = ({ children, activeChildren }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const activeChild = Children.toArray(children)[activeIndex] as ReactElement<SwitcherItemProps>;
    if (activeChildren && activeChild) {
      activeChildren(activeChild.props.children);
    }
  }, [activeIndex, children, activeChildren]);

  const handleClick = (index: number) => {
    setActiveIndex(index);
  };

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        {Children.map(children, (child, index) => {
          if (React.isValidElement<SwitcherItemProps>(child)) {
            return (
              <div
                key={index}
                onClick={() => handleClick(index)}
                className={`cursor-pointer ${index === activeIndex ? 'font-bold' : ''}`}
              >
                {child.props.label}
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};

Switcher.Item = SwitcherItem;

export default Switcher;
