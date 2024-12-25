import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  FC,
  ReactNode,
  useCallback,
} from 'react';
import classNames from 'classnames';

interface VisibleItems {
  [key: string]: boolean;
}

interface AccordionContextProps {
  visibleItems: VisibleItems;
  onToggle: (key: string) => void;
  register: (key: string) => void;
}

const AccordionContext = createContext<AccordionContextProps | undefined>(undefined);

interface AccordionProps {
  mode?: 'single' | 'multiple';
  defaultOpen?: string[];
  items?: { name: string; content: ReactNode }[];
  children?: ReactNode;
}

export const Accordion: FC<AccordionProps> & { Item: typeof AccordionItem } = ({
  mode = 'single',
  defaultOpen = [],
  items = [],
  children,
}) => {
  const [visibleItems, setVisibleItems] = useState<VisibleItems>(
    defaultOpen.reduce((acc, cur) => ({ ...acc, [cur]: true }), {}),
  );

  const handleItemRegister = useCallback((key: string) => {
    setVisibleItems((prev) => ({ ...prev, [key]: prev[key] ?? false }));
  }, []);

  const handleItemChange = useCallback(
    (key: string) => {
      setVisibleItems((prev) => {
        if (mode === 'multiple') {
          return { ...prev, [key]: !prev[key] };
        } else {
          return Object.keys(prev).reduce((acc, k) => {
            acc[k] = k === key ? !prev[key] : false;
            return acc;
          }, {} as VisibleItems);
        }
      });
    },
    [mode],
  );

  const contextValue = useMemo(
    () => ({
      visibleItems,
      onToggle: handleItemChange,
      register: handleItemRegister,
    }),
    [visibleItems, handleItemChange, handleItemRegister],
  );

  return (
    <AccordionContext.Provider value={contextValue}>
      {items.map((item) => (
        <AccordionItem key={item.name} name={item.name}>
          {item.content}
        </AccordionItem>
      ))}
      {children}
    </AccordionContext.Provider>
  );
};

interface AccordionItemProps {
  name: string;
  children: ReactNode;
}

const AccordionItem: FC<AccordionItemProps> = ({ name, children }) => {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error('AccordionItem must be used within an Accordion');
  }
  const { visibleItems, onToggle, register } = context;

  useEffect(() => {
    register(name);
  }, [name, register]);

  const contentStyle = {
    maxHeight: visibleItems[name] ? '1000px' : '0',
    overflow: 'hidden',
    transition: 'max-height 200ms ease-in-out, opacity 200ms ease-in-out',
    opacity: visibleItems[name] ? 1 : 0,
  };

  return (
    <div className="border-b transition-all duration-300 ease-in-out">
      <div className="flex items-center gap-2">
        <button className="w-full px-4 py-2 text-left" onClick={() => onToggle(name)}>
          {name}
        </button>
        <div
          onClick={() => onToggle(name)}
          className={classNames(
            'w-fit cursor-pointer rounded-full text-white shadow-lg transition-all duration-300 ease-in-out',
            {
              'rotate-90': visibleItems[name],
              'rotate-[-90deg]': !visibleItems[name],
            },
          )}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </div>
      </div>
      <div style={contentStyle}>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

Accordion.Item = AccordionItem;

export default Accordion;
