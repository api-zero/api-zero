import type { Transport } from "@api-zero/core";
import { ApiError } from "@api-zero/core";

// A 404 exercises the real error pipeline, so the component receives a genuine
// ApiError with isNotFound() working — not a stub that happens to look right.
export const notFound: Transport = {
  async send() {
    return { status: 404, statusText: "Not Found", headers: {}, data: null };
  },
};

// Never resolving is how you assert a loading state without faking timers.
export const pending: Transport = {
  send: () => new Promise(() => {}),
};

// A network failure has no response at all: status 0.
export const offline: Transport = {
  async send() {
    throw ApiError.from("Network request failed", { isNetworkError: true });
  },
};
