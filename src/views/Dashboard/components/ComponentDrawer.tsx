import Accordion from '@/app/components/Accordion/Accordion';
import { AccordionItem } from './AccordionIten';
import Drawer from '@/app/components/Drawer/Drawer';

interface Props {
  isOpen: (open: boolean) => void;
}

const ComponentDrawer = (props: Props) => {
  return (
    <Drawer isOpened={(e) => props.isOpen(e)}>
      <Accordion
        mode="single"
        items={[
          {
            name: 'Area Charts',
            content: (
              <div className="flex flex-col gap-[20px]">
                <AccordionItem
                  imageUrl={'/img/charts/line.png'}
                  type={'EntryArea'}
                  title={'Area Chart'}
                />
                <AccordionItem
                  imageUrl={'/img/charts/line.png'}
                  type={'IndexArea'}
                  title={'Multiple Area Chart'}
                />
                <AccordionItem
                  imageUrl={'/img/charts/trading.png'}
                  type={'TradingLine'}
                  title={'TradingLine'}
                />
              </div>
            ),
          },
          {
            name: 'Bar Charts',
            content: (
              <div className="flex flex-col gap-[20px]">
                <AccordionItem
                  imageUrl={'/img/charts/line.png'}
                  type={'EntryArea'}
                  title={'Area Chart'}
                />
                <AccordionItem
                  imageUrl={'/img/charts/trading.png'}
                  type={'EntryArea'}
                  title={'TreningLine'}
                />
              </div>
            ),
          },
          {
            name: 'Pie Charts',
            content: (
              <div className="flex flex-col gap-[20px]">
                <AccordionItem
                  imageUrl={'/img/charts/line.png'}
                  type={'EntryArea'}
                  title={'Area Chart'}
                />
                <AccordionItem
                  imageUrl={'/img/charts/trading.png'}
                  type={'EntryArea'}
                  title={'TreningLine'}
                />
              </div>
            ),
          },
          {
            name: 'Composed Charts',
            content: (
              <div className="flex flex-col gap-[20px]">
                <AccordionItem
                  imageUrl={'/img/charts/line.png'}
                  type={'EntryArea'}
                  title={'Area Chart'}
                />
                <AccordionItem
                  imageUrl={'/img/charts/trading.png'}
                  type={'EntryArea'}
                  title={'TreningLine'}
                />
              </div>
            ),
          },
        ]}
      />
    </Drawer>
  );
};

export default ComponentDrawer;
