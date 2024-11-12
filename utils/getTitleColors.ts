import { IndexedEntries } from '@/types/types';
export const colors = ['#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f'];
export const getTitleColors = (data: IndexedEntries[]) => {
  const titlesSet = new Set<string>();

  data?.forEach((series) => {
    series.data.forEach((point) => {
      titlesSet.add(point.title);
    });
  });

  const titles = Array.from(titlesSet);
  const titleColors: { [key: string]: string } = {};

  titles.forEach((title, idx) => {
    titleColors[title] = colors[idx % colors.length];
  });

  return titleColors;
};
