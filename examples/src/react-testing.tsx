import type { Transport } from "@api-zero/core";
import { createClient } from "@api-zero/core";
import { ApiProvider } from "@api-zero/react";
import type { ReactNode } from "react";

// A provider backed by a fake transport. Components under it make real
// requests through the real client — only the network is replaced.
export function TestProvider({
  children,
  data,
}: {
  children: ReactNode;
  data: unknown;
}) {
  const transport: Transport = {
    async send() {
      return { status: 200, statusText: "OK", headers: {}, data };
    },
  };

  return (
    <ApiProvider
      client={createClient({ baseURL: "https://api.test", transport })}
    >
      {children}
    </ApiProvider>
  );
}
