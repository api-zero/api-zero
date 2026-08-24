"use client";

import { Github, Menu, Moon, Sun, X } from "lucide-react";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SearchDialog = dynamic(
  () => import("fumadocs-ui/components/dialog/search-default"),
  {
    ssr: false,
  },
);

export function Navbar() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 50);
  });

  const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#comparison", label: "Comparison" },
    { href: "#quickstart", label: "Quick Start" },
    { href: "/docs", label: "Docs" },
  ];

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300"
    >
      <motion.div
        layout
        className={cn(
          "relative border-b bg-background/80 backdrop-blur-md shadow-sm grid grid-cols-3 items-center transition-all duration-300 mx-auto px-6",
          scrolled ? "py-3" : "py-4",
        )}
      >
        {/* Logo */}
        <Link
          href="/"
          className="font-bold text-xl flex items-center gap-2 justify-self-start"
        >
          <span className="text-gradient">api-zero</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center justify-center gap-8 justify-self-center">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors relative group"
            >
              {link.label}
              <span className="absolute -bottom-1 left-1/2 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full group-hover:left-0" />
            </Link>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center gap-2 justify-self-end">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="rounded-full hover:text-primary hover:bg-primary/10"
          >
            <Link
              href="https://github.com/api-zero/api-zero"
              target="_blank"
              rel="noreferrer"
            >
              <Github className="w-5 h-5" />
              <span className="sr-only">GitHub</span>
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:text-primary hover:bg-primary/10"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {mounted ? (
              theme === "dark" ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )
            ) : (
              <span className="w-5 h-5" /> // Placeholder to prevent layout shift
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-muted-foreground hover:text-primary transition-colors justify-self-end"
          aria-label="Toggle menu"
          type="button"
        >
          {mobileMenuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </motion.div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="md:hidden absolute top-full left-0 right-0 border-b bg-background/95 backdrop-blur-md shadow-lg py-4 px-6 max-w-7xl mx-auto"
        >
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 border-t flex items-center justify-between gap-3">
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="rounded-full"
              >
                <Link
                  href="https://github.com/api-zero/api-zero"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Github className="w-5 h-5" />
                  <span className="sr-only">GitHub</span>
                </Link>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => {
                  setTheme(theme === "dark" ? "light" : "dark");
                  setMobileMenuOpen(false);
                }}
              >
                {mounted ? (
                  theme === "dark" ? (
                    <Moon className="w-5 h-5" />
                  ) : (
                    <Sun className="w-5 h-5" />
                  )
                ) : (
                  <span className="w-5 h-5" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </motion.nav>
  );
}
