'use client';
import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Button from '@/app/components/Button/Button';

import StickyImageScroll from '../ImageScroll';

const HeroSection = () => {
  return (
    <div className="w-full">
      <Header />
      <StickyImageScroll />
    </div>
  );
};

const Header = () => (
  <div className="relative w-full px-[80px] py-[100px]">
    <video
      className="absolute left-0 top-0 h-full w-full object-cover"
      autoPlay
      loop
      muted
      playsInline
    >
      <source src={'video/dashboard.mp4'} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
    <div className="absolute left-0 top-0 h-full w-full bg-black opacity-70"></div>
    <div className="relative z-10 h-full gap-5">
      <h1 className="text-2xl font-bold leading-5 text-white md:text-7xl">
        Excel stress?
        <br /> We turn your data mess <br /> into dashboard success!
      </h1>
      <Button radius="squared" type="secondary">
        Get Started
      </Button>
    </div>
  </div>
);

export default HeroSection;
