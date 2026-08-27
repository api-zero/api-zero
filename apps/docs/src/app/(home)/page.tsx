import { Comparison } from "@/components/landing/Comparison";
import { Features } from "@/components/landing/Features";
import { Footer } from "@/components/landing/Footer";
import { Hero } from "@/components/landing/Hero";
import { Lifecycle } from "@/components/landing/Lifecycle";
import { Problem } from "@/components/landing/Problem";
import { QuickStart } from "@/components/landing/QuickStart";

export default function HomePage() {
  return (
    <>
      <main className="flex-1">
        <Hero />
        <Problem />
        <Lifecycle />
        <Features />
        <Comparison />
        <QuickStart />
      </main>
      <Footer />
    </>
  );
}
