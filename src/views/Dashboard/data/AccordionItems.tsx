import { AccordionGroup } from '../components/ComponentDrawer';

export const accordionItemsData = (): AccordionGroup[] => [
  {
    name: 'Line Charts',
    items: [
      {
        type: 'EntryArea',
        title: 'Line',
        imageUrl: '/img/charts/line.png',
      },
      {
        type: 'IndexLine',
        title: 'Multiple Line Chart',
        imageUrl: '/img/charts/IndexLine.png',
      },
      {
        type: 'TradingLine',
        title: 'Trading Chart',
        imageUrl: '/img/charts/trading.png',
        imageHeight: 70,
        imageWidth: 70,
      },
    ],
  },
  {
    name: 'Others',
    items: [
      {
        type: 'IndexBar',
        title: 'Bar Chart',
        imageUrl: '/img/charts/Bar.png',
        imageHeight: 50,
        imageWidth: 50,
      },
      {
        type: 'Pie',
        title: 'Pie',
        imageUrl: '/img/charts/Pie.png',
        imageHeight: 60,
        imageWidth: 60,
      },
      {
        type: 'Radar',
        title: 'Radar',
        imageUrl: '/img/charts/Pie2.png',
      },
    ],
  },
];
