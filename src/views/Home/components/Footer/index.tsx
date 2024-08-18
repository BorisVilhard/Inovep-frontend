import Image from 'next/image';
interface Props{
  className?:string
}

const Footer = (props:Props) => {
  return (
      <div
        style={{
          background: 'linear-gradient(93deg, rgba(21,93,240,1) 10%, rgba(7,7,156,1) 70%)',
        }}
        className={`flex h-fit w-[80%] flex-col items-center justify-center rounded-[20px] sm:flex-col md:flex-col lg:flex-row ${props.className}`}
      >
        <Image width={400} height={400} src={'/img/rocket.webp'} alt='float' className="animate-float"/>
        <div className="text-white flex flex-col justify-center p-8">
          <h1 className="mb-5 text-4xl font-bold text-shades-white">
            Got you interested? Find out more by subscribing to our newsletter!
          </h1>
          <div className="relative mt-5 max-w-[530px] overflow-hidden rounded-full lg:mt-[25px]">
            <input
              type="text"
              className="font-roboto bg-white w-full py-4 pl-6 pr-[120px] text-[15px]/[18px] placeholder:text-[15px]/[18px] placeholder:text-[#414141] lg:py-[25px] lg:pl-[31px] lg:pr-[180px]"
              placeholder="Enter your email"
            />
            
            <button className="font-roboto absolute right-1 top-1/2 h-[calc(100%-7px)] -translate-y-1/2 rounded-full bg-[#4379F5] px-5 text-sm font-medium text-shades-white lg:right-1.5 lg:h-[57px] lg:px-[41px] lg:text-[17px]/[20px]">
              Subscribe
            </button>
          </div>
        </div>
      </div>
  );
};

export default Footer;
