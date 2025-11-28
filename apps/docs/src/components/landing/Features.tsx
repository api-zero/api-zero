import { Zap, Shield, Code2, Feather, RefreshCw, Layers } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';

const features = [
  {
    icon: Feather,
    title: 'Ultra Lightweight',
    description: 'Less than 2KB gzipped. No dependencies. Keeps your bundle size minimal without sacrificing power.',
  },
  {
    icon: Shield,
    title: 'Type-Safe',
    description: 'Built with TypeScript for TypeScript. Generic request/response types and full type inference out of the box.',
  },
  {
    icon: Code2,
    title: 'Modern API',
    description: 'Clean, promise-based API designed for modern JavaScript and React applications. No legacy baggage.',
  },
  {
    icon: RefreshCw,
    title: 'Smart Retries',
    description: 'Built-in retry mechanism with configurable backoff strategies (exponential, linear, custom).',
  },
  {
    icon: Layers,
    title: 'Interceptors',
    description: 'Powerful request and response interceptors for authentication, logging, and data transformation.',
  },
  {
    icon: Zap,
    title: 'React Integration',
    description: 'Optional React package with Provider and hooks for seamless integration with your component tree.',
  },
];

export function Features() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight mb-4">Everything you need, nothing you don't</h2>
          <p className="text-muted-foreground text-lg">
            api-zero is opinionated about quality but flexible about implementation.
            It gives you the tools you need for robust HTTP communication.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
