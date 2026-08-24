"use client";

import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import { Bug, Code2, Gauge, RefreshCw, Shield, Zap } from "lucide-react";
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const features = [
  {
    icon: Zap,
    title: "Lightweight & Fast",
    description:
      "Built to be minimal and performant. No bloat, just what you need to make HTTP requests efficiently.",
    code: `import { createClient } from '@api-zero/core';

const api = createClient({
  baseURL: 'https://api.example.com',
  timeout: 5000,
});

// Simple and fast
const users = await api.get<User[]>('/users');`,
    lang: "typescript",
  },
  {
    icon: Shield,
    title: "Type-Safe by Default",
    description:
      "Full TypeScript support with generic types for requests, responses, and parameters. Catch errors at compile time.",
    code: `interface User {
  id: number;
  name: string;
  email: string;
}

interface CreateUserBody {
  name: string;
  email: string;
}

// Type-safe request and response
const newUser = await api.post<User, CreateUserBody>(
  '/users',
  { name: 'John', email: 'john@example.com' }
);`,
    lang: "typescript",
  },
  {
    icon: RefreshCw,
    title: "Smart Retry Logic",
    description:
      "Automatic retry with exponential backoff for failed requests. Configurable retry strategies out of the box.",
    code: `const api = createClient({
  baseURL: 'https://api.example.com',
  retry: {
    attempts: 3,
    backoff: 'exponential',
    delay: 1000,
  },
});

// Automatically retries on failure
const data = await api.get('/unstable-endpoint');`,
    lang: "typescript",
  },
  {
    icon: Code2,
    title: "Interceptors",
    description:
      "Powerful request and response interceptors to modify requests, add authentication, or handle responses globally.",
    code: `api.interceptors.request.use((config) => {
  // Add auth token to all requests
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = \`Bearer \${token}\`;
  }
  return config;
});

api.interceptors.response.use((response) => {
  // Log all responses
  console.log('Response:', response.status);
  return response;
});`,
    lang: "typescript",
  },
  {
    icon: Gauge,
    title: "Progress Tracking",
    description:
      "Track upload and download progress with built-in callbacks. Perfect for file uploads and large downloads.",
    code: `await api.post('/upload', formData, {
  onUploadProgress: (progress) => {
    const percentage = (progress.loaded / progress.total) * 100;
    console.log(\`Upload: \${percentage}%\`);
  },
});

await api.get('/large-file', {
  onDownloadProgress: (progress) => {
    const percentage = (progress.loaded / progress.total) * 100;
    console.log(\`Download: \${percentage}%\`);
  },
});`,
    lang: "typescript",
  },
  {
    icon: Bug,
    title: "Better Error Handling",
    description:
      "Comprehensive error types with detailed context. Easily differentiate between network errors, timeouts, and HTTP errors.",
    code: `try {
  const data = await api.get('/users');
} catch (error) {
  if (error.isNetworkError) {
    console.error('Network issue:', error.message);
  } else if (error.isTimeout) {
    console.error('Request timed out');
  } else if (error.response?.status === 404) {
    console.error('Resource not found');
  }
}`,
    lang: "typescript",
  },
];

import { motion } from "motion/react";

// ... existing imports

export function Features() {
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <section id="features" className="py-24 relative overflow-hidden">
      <div className="container px-4 md:px-6 mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-4xl md:text-5xl md:leading-14 font-semibold tracking-[-0.03em] max-w-lg">
            Powerful Features for{" "}
            <span className="text-gradient">Modern Apps</span>
          </h2>
        </motion.div>

        <div className="mt-10 w-full mx-auto grid md:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Accordion
              defaultValue="item-0"
              type="single"
              className="w-full"
              onValueChange={(value) => {
                const index = Number.parseInt(value.split("-")[1], 10);
                setSelectedIndex(index);
              }}
            >
              {features.map(({ title, description, icon: Icon }, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="group/accordion-item data-[state=open]:border-b-2 data-[state=open]:border-primary"
                >
                  <AccordionTrigger className="text-lg [&>svg]:hidden group-first/accordion-item:pt-0">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-primary/10 group-data-[state=open]/accordion-item:bg-primary/20 transition-colors">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      {title}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-[17px] leading-relaxed text-muted-foreground pl-[52px]">
                    {description}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>

          {/* Code Block */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="hidden md:block w-full h-full"
          >
            <div className="sticky top-24 shadow-2xl shadow-primary/10 rounded-xl overflow-hidden border border-primary/20">
              <DynamicCodeBlock
                lang="ts"
                codeblock={{ title: "api-client.ts" }}
                code={features[selectedIndex].code}
                options={{
                  themes: {
                    light: "catppuccin-latte",
                    dark: "catppuccin-mocha",
                  },
                }}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
