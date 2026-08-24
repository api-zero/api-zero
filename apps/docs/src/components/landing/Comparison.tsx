"use client";

import { motion } from "motion/react";

export function Comparison() {
  return (
    <section
      id="comparison"
      className="py-24 border-t relative overflow-hidden"
    >
      <div className="container px-4 md:px-6 mx-auto relative z-10">
        {/* Stats Section - using stats-02 block structure */}
        <div className="max-w-(--breakpoint-xl) mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tighter">
              Why choose <span className="text-gradient">api-zero</span>?
            </h2>
            <p className="mt-4 text-lg max-w-2xl text-muted-foreground">
              The perfect balance between simplicity and power. All the features
              you need without the bloat.
            </p>
          </motion.div>

          <div className="mt-16 sm:mt-24 grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-10 gap-y-16 justify-center">
            {[
              {
                value: "~2KB",
                label: "Bundle Size",
                description:
                  "Gzipped. 15x smaller than Axios (~30KB), keeping your app lightning fast.",
                highlight: true,
              },
              {
                value: "100%",
                label: "TypeScript",
                description:
                  "Full type safety with generic request/response types built-in.",
                highlight: false,
              },
              {
                value: "Zero",
                label: "Dependencies",
                description:
                  "No external dependencies. Just modern JavaScript and native Fetch API.",
                highlight: true,
              },
              {
                value: "6+",
                label: "Core Features",
                description:
                  "Retries, interceptors, progress tracking, and more out of the box.",
                highlight: false,
              },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <span
                  className={`text-5xl md:text-6xl tracking-tight font-semibold ${stat.highlight ? "text-primary" : "text-muted-foreground"}`}
                >
                  {stat.value}
                </span>
                <p className="mt-6 font-medium text-xl">{stat.label}</p>
                <p className="mt-2 text-muted-foreground">{stat.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
