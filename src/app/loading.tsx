// Import React
import React from 'react';

// Define the component
const Loading = () => {
  return (
    <div className="absolute top-[40vh]">
      <div className="relative flex h-12 w-12 items-center justify-center">
        <span className="border-t-custom-white inline-block h-12 w-12 animate-spin-slow rounded-full border-r-4 border-t-4 border-r-transparent"></span>
        <span className="border-l-custom-orange absolute left-0 top-0 h-12 w-12 animate-spin-slow-reverse rounded-full border-b-4 border-l-4 border-b-transparent"></span>
      </div>
    </div>
  );
};

// Export the component
export default Loading;
