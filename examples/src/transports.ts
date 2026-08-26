import type { Transport, TransportResponse } from "@api-zero/core";
import { createClient } from "@api-zero/core";

//#region mock
// A transport is the whole network boundary, so tests need no
// global patching and no server.
const mockTransport: Transport = {
  async send(context): Promise<TransportResponse> {
    return {
      status: 200,
      statusText: "OK",
      headers: { "content-type": "application/json" },
      data: { url: context.url, method: context.method },
    };
  },
};

const api = createClient({ transport: mockTransport });
//#endregion

export { api, mockTransport };
