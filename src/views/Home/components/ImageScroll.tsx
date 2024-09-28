import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

const StickyImageScroll: React.FC = () => {
  const descriptions = ['Description for Image 1', 'Description for Image 2'];
  const images = ['/img/screenshot.png', '/img/screenshot.png'];
  const [scrollY, setScrollY] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = () => {
    if (ref.current) {
      const scrollPosition = ref.current.scrollTop;
      const itemHeight = ref.current.scrollHeight / images.length;
      const index = Math.min(Math.floor(scrollPosition / itemHeight), images.length - 1);
      setActiveIndex(index);
    }
  };

  useEffect(() => {
    const container = ref.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (ref.current) {
        const { top } = ref.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const documentHeight = document.body.scrollHeight;
        const scrollProgress = Math.min(
          Math.max((windowHeight - top) / (documentHeight - windowHeight), 0),
          1,
        );
        setScrollY(scrollProgress);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const calculateTransform = (index: number) => {
    const translateY = scrollY * 600 * (index + 1); // Adjust Y-axis movement
    const scale = 1 + scrollY * 1; // Scale image from smaller to larger
    const rotate = (1 - scrollY) * 0 * (index % 2 === 0 ? 1 : -1); // Rotate based on scroll
    return {
      transform: `translateY(${translateY}px) scale(${scale}) rotate(${rotate}deg)`,
      transition: 'transform 0.3s ease-out',
    };
  };

  return (
    <div
      ref={ref}
      style={calculateTransform(0)}
      className="relative flex h-[200vh] w-full items-start overflow-scroll"
    >
      <div className="flex h-full w-full snap-y snap-mandatory flex-col items-center justify-start">
        {images.map((src, index) => (
          <div
            key={index}
            className="scrollbar-hide flex w-[650px]  snap-always items-center justify-center overflow-y-scroll"
          >
            <Image
              src={src}
              alt={`Parallax ${index + 1}`}
              className="rounded-[20px]"
              width={800}
              height={800}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default StickyImageScroll;
