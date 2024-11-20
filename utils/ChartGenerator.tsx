import EntryAreaGraph from '@/app/components/Graphs/AreaGraph/EntryAreaGraph';
import BarGraph from '@/app/components/Graphs/BarGraph/BarGraph';
import IndexLineGraph from '@/app/components/Graphs/LineGraph/IndexLineGraph';
import TradingLineChart from '@/app/components/Graphs/LineGraph/TradingLineGraph';
import PieGraph from '@/app/components/Graphs/PieGraph/PieGraph';
import RadarGraph from '@/app/components/Graphs/PieGraph/Radar';
import { ChartType, CombinedChart, Entry, IndexedEntries } from '@/types/types';
import { getTitleColors } from './getTitleColors';

type GenerateChartProps = {
  chartType: ChartType;
  data: Entry[] | CombinedChart[];
  titleColors?: { [title: string]: string };
};

export const generateChart = ({ chartType, data, titleColors }: GenerateChartProps) => {
  switch (chartType) {
    case 'Bar':
      return <BarGraph type="entry" data={data as Entry[]} />;
    case 'IndexBar':
      return <BarGraph type="summary" data={data as Entry[]} />;
    case 'EntryArea':
      return <EntryAreaGraph data={data as Entry[]} />;
    case 'IndexLine':
      if (!titleColors) {
        titleColors = getTitleColors(data as CombinedChart[]);
      }
      return <IndexLineGraph data={data as CombinedChart[]} titleColors={titleColors} />;
    case 'TradingLine':
      return <TradingLineChart data={data as Entry[]} />;
    case 'Pie':
      if (!titleColors) {
        titleColors = getTitleColors(data as Entry[]);
      }
      return <PieGraph data={data as Entry[]} titleColors={titleColors} />;
    case 'Radar':
      if (!titleColors) {
        titleColors = getTitleColors(data as Entry[]);
      }
      return <RadarGraph data={data as Entry[]} titleColors={titleColors} />;
    default:
      return <EntryAreaGraph data={data as Entry[]} />;
  }
};
