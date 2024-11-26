import Accordion from '@/app/components/Accordion/Accordion';
import { AccordionItem } from './AccordionIten';
import Drawer from '@/app/components/Drawer/Drawer';
import { useStore } from '../../../../utils/editModeStore';

interface Props {
  isOpen: (open: boolean) => void;
}

const ComponentDrawer = (props: Props) => {
  const { type } = useStore();
  console.log(type);
  return (
    <Drawer isOpened={(e) => props.isOpen(e)}>
      <Accordion
        mode="single"
        defaultOpen={['Line Charts']}
        items={[
          {
            name: 'Line Charts',
            content: (
              <div className="flex flex-col gap-[20px]">
                <AccordionItem
                  imageUrl={'/img/charts/line.png'}
                  type={'EntryArea'}
                  title={'Line'}
                  dataType={type}
                />
                <AccordionItem
                  imageUrl={'/img/charts/IndexLine.png'}
                  type={'IndexLine'}
                  title={'Multiple Line Chart'}
                  dataType={type}
                />
                <AccordionItem
                  imageUrl={'/img/charts/trading.png'}
                  imageHeight={70}
                  imageWidth={70}
                  type={'TradingLine'}
                  title={'Trading Chart'}
                  dataType={type}
                />
              </div>
            ),
          },
          {
            name: 'Others',
            content: (
              <div className="flex flex-col gap-[20px]">
                <AccordionItem
                  imageHeight={50}
                  imageWidth={50}
                  imageUrl={'/img/charts/Bar.png'}
                  dataType={type}
                  title={'Bar Chart'}
                  type={type === 'entry' ? 'Bar' : 'IndexBar'}
                />
                <AccordionItem
                  imageHeight={60}
                  imageWidth={60}
                  imageUrl={'/img/charts/Pie.png'}
                  type={'Pie'}
                  title={'Pie'}
                  dataType={type}
                />
                <AccordionItem
                  dataType={type}
                  imageUrl={'/img/charts/Pie2.png'}
                  type={'Radar'}
                  title={'Radar'}
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
