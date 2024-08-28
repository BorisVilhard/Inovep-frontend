import EntryAreaGraph from '@/app/components/Graphs/AreaGraph/EntryAreaGraph';
import IndexAreaGraph from '@/app/components/Graphs/AreaGraph/IndexedAreaGraph';
import BarGraph from '@/app/components/Graphs/BarGraph/BarGraph';

import TradingLineChart from '@/app/components/Graphs/LineGraph/TradingLineGraph';
import PieGraph from '@/app/components/Graphs/PieGraph/PieGraph';
import { Entry, IndexedEntries } from '@/types/types';

export const generateChart = (chartType: string, data: Entry[] | IndexedEntries[], key: string) => {
  switch (chartType) {
    case 'Bar':
      return <BarGraph data={data as Entry[]} key={key} />;
    case 'EntryArea':
      return <EntryAreaGraph data={data as Entry[]} key={key} />;
    case 'IndexArea':
      return <IndexAreaGraph data={data as IndexedEntries[]} key={key} />;
    case 'Line':
      return <IndexAreaGraph data={data as IndexedEntries[]} />;
    case 'TradingLine':
      return <TradingLineChart data={data as Entry[]} />;
    case 'Pie':
      return <PieGraph data={data as Entry[]} key={key} />;
    default:
      return <EntryAreaGraph data={data as Entry[]} key={key} />;
  }
};
