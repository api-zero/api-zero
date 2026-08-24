import { RootProvider } from "fumadocs-ui/provider/next";
import "./global.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
});

/**
 * Absolute base for resolving Open Graph and Twitter image URLs.
 *
 * Without it Next resolves those URLs relatively and social platforms cannot
 * fetch the generated /og/docs/[...slug] images. Vercel preview deployments
 * expose their own host through VERCEL_URL, so use it when present.
 */
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
  : process.env.VERCEL_URL
    ? new URL(`https://${process.env.VERCEL_URL}`)
    : new URL("https://api-zero.vercel.app");

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "api-zero",
    template: "%s | api-zero",
  },
  description:
    "Lightweight, type-safe HTTP client built on the Fetch API with interceptors, retries, and structured errors.",
  openGraph: {
    type: "website",
    siteName: "api-zero",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
        <Toaster />
      </body>
    </html>
  );
}
