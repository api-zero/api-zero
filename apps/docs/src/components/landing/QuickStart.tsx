"use client";

import Link from 'next/link';
import { ArrowRight, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function QuickStart() {
  const [copied, setCopied] = useState(false);
  const command = 'npm install @api-zero/core @api-zero/react';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="py-24 border-t">
      <div className="container px-4 md:px-6 mx-auto text-center">
        <h2 className="text-3xl font-bold tracking-tight mb-6">
          Ready to make better calls?
        </h2>
        <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
          Join the developers who are switching to a lighter, more modern HTTP client.
          Get started in seconds.
        </p>

        <div className="flex flex-col items-center gap-6">
          <div className="relative group">
            <div className="flex items-center gap-3 px-6 py-4 rounded-lg border bg-muted/30 font-mono text-sm">
              <span className="text-primary">$</span>
              <span>{command}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={copyToClipboard}
              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 focus:opacity-100 h-8 w-8"
              aria-label="Copy command"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild size="lg" className="h-12 px-8 text-base">
              <Link href="/docs">
                Read the Docs
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base bg-background">
              <Link href="/docs/getting-started">
                Quick Start Guide
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
