import Header from '@/components/Header';
import Hero from '@/components/Hero';
import DealGrid from '@/components/DealGrid';
import SubscriptionCTA from '@/components/SubscriptionCTA';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main>
      <Header />
      <Hero />
      <DealGrid />
      <SubscriptionCTA />
      <Footer />
    </main>
  );
}
