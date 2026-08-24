import { Comparison } from "@/components/landing/Comparison";
import { Features } from "@/components/landing/Features";
import { Footer } from "@/components/landing/Footer";
import { Hero } from "@/components/landing/Hero";
import { Navbar } from "@/components/landing/Navbar";
import { QuickStart } from "@/components/landing/QuickStart";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
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
