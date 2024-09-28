import Accordion from '@/app/components/Accordion/Accordion';
import { AccordionItem } from './AccordionIten';
import Drawer from '@/app/components/Drawer/Drawer';
import { useStore } from '../../../../utils/editModeStore';

interface Props {
  isOpen: (open: boolean) => void;
}

const ComponentDrawer = (props: Props) => {
  const { combiningData, isEditingCategory } = useStore();

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
                  isAccessible={combiningData === 0 || combiningData === 1}
                  isChecking={isEditingCategory}
                />
                <AccordionItem
                  imageUrl={'/img/charts/IndexArea.png'}
                  type={'IndexArea'}
                  imageHeight={60}
                  imageWidth={60}
                  title={'MultiArea Chart'}
                  isAccessible={combiningData > 1}
                  isChecking={isEditingCategory}
                />
                <AccordionItem
                  imageUrl={'/img/charts/IndexLine.png'}
                  type={'IndexLine'}
                  title={'Multiple Line Chart'}
                  isAccessible={combiningData > 1}
                  isChecking={isEditingCategory}
                />
                <AccordionItem
                  imageUrl={'/img/charts/trading.png'}
                  imageHeight={70}
                  imageWidth={70}
                  type={'TradingLine'}
                  title={'Trading Chart'}
                  isAccessible={combiningData <= 1}
                  isChecking={isEditingCategory}
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
                  type={combiningData > 1 ? 'IndexBar' : 'Bar'}
                  isAccessible={true}
                  isChecking={isEditingCategory}
                  title={'Bar Chart'}
                />
                <AccordionItem
                  isAccessible={combiningData > 1}
                  imageHeight={60}
                  imageWidth={60}
                  imageUrl={'/img/charts/Pie.png'}
                  isChecking={isEditingCategory}
                  type={'Pie'}
                  title={'Pie'}
                />
                <AccordionItem
                  isAccessible={combiningData > 1}
                  isChecking={isEditingCategory}
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
