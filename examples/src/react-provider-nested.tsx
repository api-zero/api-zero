import { createClient } from "@api-zero/core";
import { ApiProvider } from "@api-zero/react";
import type { ReactNode } from "react";

const mainApi = createClient({ baseURL: "https://api.example.com" });
const billingApi = createClient({ baseURL: "https://billing.example.com" });

// An inner provider shadows the outer one for its subtree. Each client keeps
// its own headers and interceptors, so a token on one never travels to the
// other — which is what you want when the second service is a third party.
export function App({
  dashboard,
  invoices,
}: {
  dashboard: ReactNode;
  invoices: ReactNode;
}) {
  return (
    <ApiProvider client={mainApi}>
      {dashboard}
      <ApiProvider client={billingApi}>{invoices}</ApiProvider>
    </ApiProvider>
  );
}
