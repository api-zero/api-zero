"use client";

import { Github, Twitter } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

const footerLinks = [
  {
    title: "Documentation",
    href: "/docs",
  },
  {
    title: "Features",
    href: "#features",
  },
  {
    title: "Comparison",
    href: "#comparison",
  },
  {
    title: "Quick Start",
    href: "#quickstart",
  },
  {
    title: "GitHub",
    href: "https://github.com/api-zero/api-zero",
  },
  {
    title: "NPM",
    href: "https://www.npmjs.com/package/@api-zero/core",
  },
];

export function Footer() {
  return (
    <footer className="border-t relative overflow-hidden">
      <div className="container px-4 md:px-6 mx-auto relative z-10">
        <div className="py-12 flex flex-col justify-start items-center">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Link
              href="/"
              className="font-bold text-2xl flex items-center gap-2"
            >
              <span className="text-gradient">api-zero</span>
            </Link>
          </motion.div>

          <motion.ul
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-6 flex items-center gap-4 flex-wrap justify-center"
          >
            {footerLinks.map(({ title, href }) => (
              <li key={title}>
                <Link
                  href={href}
                  className="text-muted-foreground hover:text-primary transition-colors relative group"
                  target={href.startsWith("http") ? "_blank" : undefined}
                >
                  {title}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
                </Link>
              </li>
            ))}
          </motion.ul>
        </div>
        <Separator />
        <div className="py-8 flex flex-col-reverse sm:flex-row items-center justify-between gap-x-2 gap-y-5">
          {/* Copyright */}
          <span className="text-muted-foreground">
            &copy; {new Date().getFullYear()}{" "}
            <span className="font-medium text-foreground">api-zero</span>. All
            rights reserved.
          </span>

          <div className="flex items-center gap-5 text-muted-foreground">
            <Link
              href="https://twitter.com"
              target="_blank"
              className="hover:text-primary transition-all duration-300 hover:scale-110"
            >
              <Twitter className="h-5 w-5" />
              <span className="sr-only">Twitter</span>
            </Link>
            <Link
              href="https://github.com/api-zero/api-zero"
              target="_blank"
              className="hover:text-primary transition-all duration-300 hover:scale-110"
            >
              <Github className="h-5 w-5" />
              <span className="sr-only">GitHub</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
