import { useEffect } from 'react';
import { MdEdit } from 'react-icons/md';

interface Props {
  isOpen: boolean;
  getOpenedState?: (isOpen: boolean) => void;
  chartId: number | string;
  getChartId: (chartId: number | string | undefined) => void;
  className?: string;
}

const ChartEditBar = (props: Props) => {
  useEffect(() => {
    if (props.getOpenedState) props.getOpenedState(props.isOpen);
  }, [props.isOpen]);

  return (
    <div>
      <div className={`absolute right-0 top-0 z-50  m-[1px] ${props.className}`}>
        {props.isOpen ? (
          <div className="mt-[5px] flex w-[200px] gap-1">
            <div
              onClick={() => props.getChartId(undefined)}
              className="flex h-full w-full cursor-pointer items-center justify-center rounded-full  bg-gray-800"
            >
              <a className="p-[4px] text-[10px] font-bold text-white">Close</a>
            </div>
            <div className="flex h-full w-full cursor-pointer items-center justify-center rounded-full  bg-gray-800">
              <a className="p-[4px] text-[10px] font-bold text-white">Delete</a>
            </div>
          </div>
        ) : (
          <div
            onClick={() => props.getChartId(props.chartId)}
            className="flex h-full w-full cursor-pointer items-center justify-center rounded-full  bg-gray-800 p-[6px]"
          >
            <MdEdit color="white" />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartEditBar;
