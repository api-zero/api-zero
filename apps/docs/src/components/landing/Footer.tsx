import Link from 'next/link';
import { Github, Twitter } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-card py-12">
      <div className="container px-4 md:px-6 mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="font-bold text-xl">api-zero</div>
          <span className="text-muted-foreground text-sm">© {new Date().getFullYear()}</span>
        </div>

        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="/docs" className="hover:text-foreground transition-colors">
            Documentation
          </Link>
          <Link href="https://github.com/gorka/better-call" target="_blank" className="hover:text-foreground transition-colors">
            GitHub
          </Link>
          <Link href="https://www.npmjs.com/package/@api-zero/core" target="_blank" className="hover:text-foreground transition-colors">
            NPM
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link href="https://github.com/gorka/better-call" target="_blank" className="text-muted-foreground hover:text-foreground transition-colors">
            <Github className="w-5 h-5" />
            <span className="sr-only">GitHub</span>
          </Link>
          <Link href="https://twitter.com" target="_blank" className="text-muted-foreground hover:text-foreground transition-colors">
            <Twitter className="w-5 h-5" />
            <span className="sr-only">Twitter</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
