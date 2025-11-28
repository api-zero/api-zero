import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { Comparison } from '@/components/landing/Comparison';
import { QuickStart } from '@/components/landing/QuickStart';
import { Footer } from '@/components/landing/Footer';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <Hero />
        <Features />
        <Comparison />
        <QuickStart />
      </main>
      <Footer />
    </div>
  );
}
