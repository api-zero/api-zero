import type { RequestContext, Transport } from "@api-zero/core";
import { createClient } from "@api-zero/core";

/**
 * Records what was sent and replies with whatever the test needs.
 * No network, no server, no global patching.
 */
export function recordingTransport(
  reply: (context: RequestContext) => unknown,
) {
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

  return { transport, sent };
}

const { transport, sent } = recordingTransport(() => ({
  id: 1,
  name: "Alice",
}));
const api = createClient({ baseURL: "https://api.test", transport });

const user = await api.get<{ name: string }>("/users/1");

console.assert(user.name === "Alice");
console.assert(sent[0].url === "https://api.test/users/1");
console.assert(sent[0].method === "GET");
