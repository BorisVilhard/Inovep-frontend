import EntryAreaGraph from '@/app/components/Graphs/AreaGraph/EntryAreaGraph';
import IndexAreaGraph from '@/app/components/Graphs/AreaGraph/IndexedAreaGraph';
import BarGraph from '@/app/components/Graphs/BarGraph/BarGraph';
import IndexLineGraph from '@/app/components/Graphs/LineGraph/IndexLineGraph';
import TradingLineChart from '@/app/components/Graphs/LineGraph/TradingLineGraph';
import PieGraph from '@/app/components/Graphs/PieGraph/PieGraph';
import RadarGraph from '@/app/components/Graphs/PieGraph/Radar';
import { ChartType, Entry, IndexedEntries } from '@/types/types';

export const generateChart = (chartType: ChartType, data: Entry[] | IndexedEntries[]) => {
  switch (chartType) {
    case 'Bar':
      return <BarGraph type="entry" data={data as Entry[]} />;
    case 'IndexBar':
      return <BarGraph type="summary" data={data as Entry[]} />;
    case 'EntryArea':
      return <EntryAreaGraph data={data as Entry[]} />;
    case 'IndexArea':
      return <IndexAreaGraph data={data as IndexedEntries[]} />;
    case 'IndexLine':
      return <IndexLineGraph data={data as IndexedEntries[]} />;
    case 'TradingLine':
      return <TradingLineChart data={data as Entry[]} />;
    case 'Pie':
      return <PieGraph data={data as Entry[]} />;
    case 'Radar':
      return <RadarGraph data={data as Entry[]} />;
    default:
      return <EntryAreaGraph data={data as Entry[]} />;
  }
};
