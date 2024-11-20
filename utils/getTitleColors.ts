import { Entry, CombinedChart } from '@/types/types';

export const colors = ['#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f'];

const isIndexedEntries = (item: CombinedChart | Entry): item is CombinedChart => {
  return (item as CombinedChart).data !== undefined;
};

export const getTitleColors = (data: CombinedChart[] | Entry[]): { [key: string]: string } => {
  const titlesSet = new Set<string>();

  data.forEach((item) => {
    if (isIndexedEntries(item)) {
      item.data.forEach((point) => {
        titlesSet.add(point.title);
      });
    } else {
      titlesSet.add(item.title);
    }
  });

  const titles = Array.from(titlesSet);
  const titleColors: { [key: string]: string } = {};

  titles.forEach((title, idx) => {
    titleColors[title] = colors[idx % colors.length];
  });

  return titleColors;
};
