'use client';
import Services from './Sections/Services';
import HeroSection from './Sections/Hero';
import About from './Sections/About';
import Contact from './Sections/Contact';

const HomePage = () => {
  return (
    <div>
      <HeroSection />
      <About />
      <Services />
      <Contact />
    </div>
  );
};

export default HomePage;
