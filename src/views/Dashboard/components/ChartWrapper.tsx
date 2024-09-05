import { ReactNode } from 'react';

interface Props {
  title?: string;
  value?: number | string;
  children: ReactNode;
  percentageDifference?: string;
  id?: string;
  className?: string;
  onClick?: () => void;
}

export const ChartWrapper = (props: Props) => {
  return (
    <div
      style={{ boxShadow: 'rgba(149, 157, 165, 0.2) 0px 8px 24px' }}
      className={`relative m-[10px] flex flex-col items-stretch  justify-between rounded-[10px] p-[10px] ${props.className}`}
      onClick={props.onClick}
    >
      {props.title !== '' && <h1 className={'ml-[3px] text-[16px] font-medium'}>{props.title}</h1>}
      <div>
        <h1 className={'font-500 text-[35px]'}>{props.value}</h1>
        <div>{props.children}</div>
      </div>
    </div>
  );
};
