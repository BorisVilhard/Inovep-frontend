import Image from 'next/image';

export default function Custom404() {
  return (
    <div className="flex w-full h-[90vh] flex-col items-center justify-center">
      <Image src={'/img/404.png'} width={600} height={600} alt="404" />
      
      <h1 className="font-bold">Page not found</h1>
    </div>
  );
}
