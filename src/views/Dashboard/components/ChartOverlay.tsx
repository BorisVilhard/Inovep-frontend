import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  textSize?: string;
}

const ChartOverlay = (props: Props) => {
  return (
    <div className="stage absolute z-30 ">
      <figure className="ball bubble absolute">
        <div className="absolute inset-0 z-40 rounded-[5px] bg-shades-black bg-opacity-25 backdrop-blur-sm"></div>
        <div className="absolute inset-0 z-40 flex items-center justify-center text-shades-white">
          <h1 className={`text-[${props.textSize ? props.textSize : '15px'}] font-bold`}>
            {props.children}
          </h1>
        </div>
      </figure>
    </div>
  );
};

export default ChartOverlay;
