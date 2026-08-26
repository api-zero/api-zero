import { useApi } from "@api-zero/react";
import { useQuery } from "@tanstack/react-query";

interface User {
  id: number;
  name: string;
}

export function useUser(id: number) {
  const api = useApi();

  return useQuery({
    queryKey: ["user", id],
    // TanStack Query supplies an AbortSignal and aborts it when the query
    // is cancelled, unmounted or superseded. Forwarding it is what makes
    // the HTTP request actually stop instead of finishing and being
    // thrown away.
    queryFn: ({ signal }) => api.get<User>(`/users/${id}`, { signal }),
  });
}
