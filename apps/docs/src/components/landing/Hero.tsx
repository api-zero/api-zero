"use client";

import { ArrowRight, Github } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import AnimatedGridPattern from "@/components/ui/animated-grid-pattern";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Hero() {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-6 pt-20 overflow-hidden">
      <AnimatedGridPattern
        numSquares={30}
        maxOpacity={0.1}
        duration={3}
        className={cn(
          "mask-[radial-gradient(500px_circle_at_center,white,transparent)]",
          "inset-x-0 h-full skew-y-12",
        )}
      />
      <div className="relative z-10 text-center max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Badge
            variant="secondary"
            className="rounded-full py-1 border-border text-primary"
            asChild
          >
            <Link href="/docs">
              v1.0.0 is now available <ArrowRight className="ml-1 size-4" />
            </Link>
          </Badge>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-6 text-4xl sm:text-5xl md:text-6xl lg:text-7xl md:leading-[1.2] font-semibold tracking-tighter"
        >
          The HTTP client you've been{" "}
          <span className="text-gradient">waiting for</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 md:text-lg text-foreground/80"
        >
          Fetch is too basic. Axios is too heavy.{" "}
          <span className="text-gradient font-medium">api-zero</span> is the
          lightweight, type-safe alternative designed for modern React
          applications.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 flex items-center justify-center gap-4"
        >
          <Button
            size="lg"
            className="rounded-full text-base shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
            asChild
          >
            <Link href="/docs">
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="rounded-full text-base shadow-none hover:text-primary hover:bg-primary/5"
            asChild
          >
            <Link
              href="https://github.com/api-zero/api-zero"
              target="_blank"
              rel="noreferrer"
            >
              <Github className="mr-2 h-5 w-5" /> GitHub
            </Link>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
