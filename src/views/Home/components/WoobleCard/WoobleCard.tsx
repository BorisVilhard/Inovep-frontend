// src/components/WobbleCard.tsx
import React from 'react';

interface WobbleCardProps {
  title: string;
  price: string;
  description: string;
}

const WobbleCard: React.FC<WobbleCardProps> = ({ title, description, price }) => {
  return (
    <div className="mt-[200px] h-[500px] max-w-sm transform cursor-pointer overflow-hidden rounded bg-gray-900 shadow-lg shadow-[#4379F5] transition duration-300 hover:rotate-2 hover:scale-105">
      <div className="flex h-full flex-col justify-between px-6 py-[25px] text-white">
        <div className=" text-2xl font-bold ">{title}</div>
        <div className="text-[80px] font-bold ">{price}</div>
        <p className="text-base">{description}</p>
      </div>
      <div className="wp-block-cover ticss-674e9f08">
        <span
          aria-hidden="true"
          className="wp-block-cover__background has-custom-dark-blue-2-background-color has-background-dim-100 has-background-dim"
        ></span>
        <div className="wp-block-cover__inner-container">
          <div className="light x1"></div>
          <div className="light x2"></div>
          <div className="light x3"></div>
          <div className="light x4"></div>
          <div className="light x5"></div>
          <div className="light x6"></div>
          <div className="light x7"></div>
          <div className="light x8"></div>
          <div className="light x9"></div>
        </div>
      </div>
    </div>
  );
};

export default WobbleCard;
