import Footer from './components/Footer';
import HeroSection from './components/HeroSection';
import WoobleCard from './components/WoobleCard/WoobleCard';

const Home = () => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      <HeroSection />
      <WoobleCard
        title="Subscription"
        price="6.90 eur /month"
        description="Get free 7day trail without adding payment info."
      />
      <Footer className="my-[100px]" />
    </div>
  );
};

export default Home;
