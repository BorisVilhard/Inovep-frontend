import Image from 'next/image';
interface Props {
  imgSrc: string;
  label: string;
}

const InfoCard = ({ imgSrc, label }: Props) => {
  const a = 1;
  return (
    <div className="relative m-[20px] my-[50px] h-fit flex-col items-center justify-between overflow-hidden rounded-[20px] bg-neutral-80 sm:flex md:h-[45vh] md:w-[85%] md:flex-row md:bg-shades-white">
      <div
        aria-label="Slate cover background"
        className={
          'absolute left-0 top-0 hidden h-[200vh] w-[150vw] translate-x-[-76%] rotate-[-22deg] items-center rounded-lg bg-neutral-80 text-white md:block md:translate-y-[-15%] md:rotate-[11deg] lg:flex'
        }
      />
      <h1 className="z-10 mx-[20px] my-[20px] w-[90%] text-left text-[28px] font-bold text-shades-white md:ml-[40px] md:w-[35%] md:text-[23px] lg:my-[10px] lg:text-[2.3vw] lg:leading-[3.2vw]">
        {label}
      </h1>

      <Image
        className="z-20 w-[100vw] md:w-[40vw]"
        src={imgSrc}
        width={550}
        height={550}
        alt="robot image"
      />
    </div>
  );
};

export default InfoCard;
