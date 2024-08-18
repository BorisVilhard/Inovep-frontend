import Button from '@/app/components/Button/Button';
import DataFlowAnimation from '../../features/DataFlowAnimation/DataFlowAnimation';

const HeroSection = () => {
  return (
    <div
      style={{
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      className="flex h-[92vh] w-full items-center justify-between px-[5vw] pb-[10vh] text-shades-white lg:bg-[url('/img/heroBg.svg')]"
    >
      <div className="relative flex w-full flex-col lg:max-w-[40vw]">
        <p className="p-2 font-bold text-primary-90">Run your company smoothly</p>
        <h1 className="text-[60px] font-bold text-shades-black md:text-[70px] lg:py-6 lg:text-[4.5vw] lg:leading-[10vh]">
          Enhance Performance with Smart Data Solutions
        </h1>
        <Button
          type="secondary"
          className="my-6 w-[200px] rounded-md bg-[#00df9a] py-3 font-medium text-black"
        >
          Get Started
        </Button>
      </div>
      <div className="relative ml-[10vw]  hidden w-full md:hidden lg:block">
        <DataFlowAnimation />
      </div>
    </div>
  );
};

export default HeroSection;
