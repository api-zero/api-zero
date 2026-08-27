import { ApiProvider } from "@api-zero/react";
import type { ReactNode } from "react";

// Convenient, and it carries a trap. An object literal in JSX is a new object
// on every render, so a naive provider would rebuild the client each time and
// discard whatever was set on the previous one.
//
// ApiProvider compares the config's contents instead of its identity, so this
// is safe — but the comparison is shallow. See the warning below.
export function Root({ children }: { children: ReactNode }) {
  return (
    <ApiProvider
      config={{ baseURL: "https://api.example.com", timeout: 10_000 }}
    >
      {children}
    </ApiProvider>
  );
}
