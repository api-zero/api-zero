import type { RequestContext, Transport } from "@api-zero/core";
import { createClient } from "@api-zero/core";
import { ApiProvider } from "@api-zero/react";
import type { ReactNode } from "react";

/**
 * Records every request the tree makes, so a test can assert on what would
 * have gone over the wire — the resolved URL, the headers after interceptors,
 * the body after transforms.
 */
export function createTestClient(reply: (context: RequestContext) => unknown) {
  const sent: RequestContext[] = [];

  const transport: Transport = {
    async send(context) {
      sent.push(context);
      return {
        status: 200,
        statusText: "OK",
        headers: { "content-type": "application/json" },
        data: reply(context),
      };
    },
  };

  return {
    client: createClient({ baseURL: "https://api.test", transport }),
    sent,
  };
}

export function Wrapper({
  client,
  children,
}: {
  client: ReturnType<typeof createTestClient>["client"];
  children: ReactNode;
}) {
  return <ApiProvider client={client}>{children}</ApiProvider>;
}
