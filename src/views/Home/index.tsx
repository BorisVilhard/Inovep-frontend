'use client';
import {  Suspense } from 'react';
import HomePage from './HomePage';
import ScrollToTop from './components/ScrollToTop';


function Home() {
  return (
    <>
      <Suspense fallback={null}> 
        <ScrollToTop/>
        <HomePage />
      </Suspense>
    </>
  );
}

export default Home;
