import Link from 'next/link';
import { ArrowRight, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-24 pb-16 md:pt-32 md:pb-24">
      <div className="container px-4 md:px-6 mx-auto relative z-10">
        <div className="flex flex-col items-center text-center space-y-8">
          <Badge variant="secondary" className="px-3 py-1 text-sm backdrop-blur-sm bg-primary/5 text-primary border-primary/20">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
            v1.0.0 is now available
          </Badge>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight bg-clip-text bg-gradient-to-b from-foreground to-foreground/60 max-w-4xl">
            The HTTP client you've been waiting for
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Fetch is too basic. Axios is too heavy. <br className="hidden md:block" />
            <span className="text-foreground font-medium">api-zero</span> is the lightweight, type-safe alternative designed for modern React applications.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
            <Button asChild size="lg" className="h-12 px-8 text-base">
              <Link href="/docs">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base bg-background">
              <Link
                href="https://github.com/gorka/better-call"
                target="_blank"
                rel="noreferrer"
              >
                <Github className="mr-2 h-4 w-4" />
                GitHub
              </Link>
            </Button>
          </div>

          <div className="w-full max-w-3xl mt-12 rounded-lg border bg-card shadow-2xl overflow-hidden text-left">
            <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/50">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
              </div>
              <div className="flex-1 text-center text-xs font-mono text-muted-foreground">
                api-client.ts
              </div>
            </div>
            <div className="p-6 overflow-x-auto bg-[#0d1117]">
              <pre className="text-sm font-mono leading-relaxed">
                <code className="language-typescript">
                  <span className="text-purple-400">import</span> <span className="text-blue-400">{`{ createClient }`}</span> <span className="text-purple-400">from</span> <span className="text-green-400">'@api-zero/core'</span>;{'\n\n'}
                  <span className="text-gray-500">// Initialize with full type safety</span>{'\n'}
                  <span className="text-purple-400">const</span> <span className="text-yellow-200">api</span> = <span className="text-blue-400">createClient</span>({`{`}{'\n'}
                  {'  '}baseURL: <span className="text-green-400">'https://api.example.com'</span>,{'\n'}
                  {'  '}retry: <span className="text-blue-400">{`{ attempts: 3, backoff: 'exponential' }`}</span>,{'\n'}
                  {`}`});{'\n\n'}
                  <span className="text-gray-500">// Use it anywhere</span>{'\n'}
                  <span className="text-purple-400">const</span> <span className="text-yellow-200">users</span> = <span className="text-purple-400">await</span> <span className="text-yellow-200">api</span>.<span className="text-blue-400">get</span>{`<User[]>('`}<span className="text-green-400">/users</span>{`');`}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-20 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 blur-[100px] rounded-full mix-blend-screen" />
      </div>
    </section>
  );
}
