"use client";

import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { ArrowRight, RouteIcon } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function QuickStart() {
  return (
    <section
      id="quickstart"
      className="py-24 border-t relative overflow-hidden"
    >
      <div className="container px-4 md:px-6 mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tighter">
            Ready to make calls with{" "}
            <span className="text-gradient">zero overhead</span>?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Join the developers who are switching to a lighter, more modern HTTP
            client. Get started in seconds.
          </p>

          <div className="flex flex-col items-center gap-6 mt-10">
            <Tabs items={["npm", "pnpm", "yarn", "bun"]}>
              <Tab value="npm">
                <DynamicCodeBlock
                  lang="bash"
                  code="npm install @api-zero/core @api-zero/react"
                />
              </Tab>
              <Tab value="pnpm">
                <DynamicCodeBlock
                  lang="bash"
                  code="pnpm add @api-zero/core @api-zero/react"
                />
              </Tab>
              <Tab value="yarn">
                <DynamicCodeBlock
                  lang="bash"
                  code="yarn add @api-zero/core @api-zero/react"
                />
              </Tab>
              <Tab value="bun">
                <DynamicCodeBlock
                  lang="bash"
                  code="bun add @api-zero/core @api-zero/react"
                />
              </Tab>
            </Tabs>

            <div className="flex items-center justify-center gap-4">
              <Button
                size="lg"
                className="rounded-full text-base shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
                asChild
              >
                <Link href="/docs">
                  Read the Docs <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="rounded-full text-base shadow-none hover:text-primary hover:bg-primary/5"
                asChild
              >
                <Link href="/docs/getting-started">
                  Quick Start Guide
                  <RouteIcon className="mr-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
