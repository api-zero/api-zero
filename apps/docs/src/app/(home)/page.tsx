import { Comparison } from "@/components/landing/Comparison";
import { Failures } from "@/components/landing/Failures";
import { Features } from "@/components/landing/Features";
import { Footer } from "@/components/landing/Footer";
import { Hero } from "@/components/landing/Hero";
import { Lifecycle } from "@/components/landing/Lifecycle";
import { Problem } from "@/components/landing/Problem";
import { QuickStart } from "@/components/landing/QuickStart";
import { SnapScroll } from "@/components/landing/snap";

export default function HomePage() {
  return (
    <>
      <SnapScroll />
      <main className="landing-snap flex-1">
        <Hero />
        <Problem />
        <QuickStart />
        <Lifecycle />
        <Failures />
        <Features />
        <Comparison />
      </main>
      <Footer />
    </>
  );
}
