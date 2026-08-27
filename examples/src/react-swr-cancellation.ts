import type { ApiClient } from "@api-zero/core";

/**
 * SWR does not hand an AbortSignal to the fetcher the way TanStack Query does,
 * so a superseded request keeps running and SWR simply ignores the result.
 *
 * For anything that fires per keystroke, hold the controller yourself.
 */
export function createSearchFetcher(api: ApiClient) {
  let controller: AbortController | undefined;

  return (url: string) => {
    controller?.abort();
    controller = new AbortController();
    return api.get<unknown[]>(url, { signal: controller.signal });
  };
}
