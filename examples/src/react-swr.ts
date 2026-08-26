import type { ApiClient } from "@api-zero/core";
import useSWR from "swr";

interface User {
  id: number;
  name: string;
}

// SWR passes the key to the fetcher. api-zero is the fetcher.
export function useUser(api: ApiClient, id: number) {
  return useSWR(`/users/${id}`, (url: string) => api.get<User>(url));
}
