import { Check } from 'lucide-react';
import { Card } from '@/components/ui/card';

export function Comparison() {
  return (
    <section className="py-24">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-6">
              Why choose api-zero?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              While Axios is a great library, it carries a lot of legacy weight.
              Fetch is built-in but requires too much boilerplate for real-world apps.
              Better Call sits in the sweet spot.
            </p>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>api-zero</span>
                  <span className="text-green-500">~2KB</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 w-[5%]" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>Ky</span>
                  <span className="text-blue-500">~6KB</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-[15%]" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>Axios</span>
                  <span className="text-red-500">~30KB</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 w-[80%]" />
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-3xl rounded-full" />
            <Card className="relative overflow-hidden shadow-2xl">
              <div className="grid grid-cols-3 border-b bg-muted/50 text-sm font-medium text-center py-3">
                <div>Feature</div>
                <div className="text-muted-foreground">Axios</div>
                <div className="text-primary">api-zero</div>
              </div>

              {[
                { name: 'Bundle Size', axios: 'Heavy (~30KB)', better: 'Tiny (~2KB)' },
                { name: 'TypeScript', axios: 'Good', better: 'Excellent' },
                { name: 'Fetch API', axios: 'XHR (Legacy)', better: 'Native Fetch' },
                { name: 'React Hooks', axios: 'External Lib', better: 'Built-in' },
                { name: 'Retries', axios: 'Plugin needed', better: 'Built-in' },
                { name: 'Interceptors', axios: <Check className="w-4 h-4 mx-auto" />, better: <Check className="w-4 h-4 mx-auto text-green-500" /> },
              ].map((row, i) => (
                <div key={i} className="grid grid-cols-3 border-b last:border-0 py-4 text-sm text-center items-center hover:bg-muted/20 transition-colors">
                  <div className="font-medium text-left px-6">{row.name}</div>
                  <div className="text-muted-foreground">{row.axios}</div>
                  <div className="font-semibold text-foreground">{row.better}</div>
                </div>
              ))}
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
