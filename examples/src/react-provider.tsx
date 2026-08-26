import { createClient } from "@api-zero/core";
import { ApiProvider } from "@api-zero/react";
import type { ReactNode } from "react";

// Create the client once, outside the component tree, so its identity
// never changes across renders.
const api = createClient({
  baseURL: "https://api.example.com",
  timeout: 10_000,
});

export function Root({ children }: { children: ReactNode }) {
  return <ApiProvider client={api}>{children}</ApiProvider>;
}
