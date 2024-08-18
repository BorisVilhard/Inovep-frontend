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
        {props.percentageDifference && (
          <div className="absolute bottom-[10px] left-[2px]">
            <div className="flex items-center">
              <h1 className={'mx-[7px] text-[15px] font-bold'}>{props.percentageDifference}</h1>
              <h1 className={'text-[13px] text-neutral-60'}>less than a week</h1>
            </div>
          </div>
        )}
        <div>{props.children}</div>
      </div>
    </div>
  );
};
