import AreaGraph from '@/app/components/Graphs/AreaGraph/AreaGraph';
import BarGraph from '@/app/components/Graphs/BarGraph/BarGraph';
import TradingLineChart from '@/app/components/Graphs/LineGraph/TradingLineGraph';
import PieGraph from '@/app/components/Graphs/PieGraph/PieGraph';
import { Entry } from '@/types/types';

export const generateChart = (chartType: string, data: Entry[], key: string) => {
  switch (chartType) {
    case 'Bar':
      return <BarGraph data={data} key={key} />;
    case 'Area':
      return <AreaGraph data={data} key={key} />;
    case 'TradingLine':
      return <TradingLineChart data={data} />;
    case 'Pie':
      return <PieGraph data={data} key={key} />;
    default:
      return <AreaGraph data={data} key={key} />;
  }
};
