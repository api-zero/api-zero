import type { ApiClient } from "@api-zero/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface User {
  id: number;
  name: string;
}

// useMutation here is TanStack's. api-zero deliberately ships no hook of that
// name — the cache invalidation below is exactly the reason why.
export function useCreateUser(api: ApiClient) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { name: string }) => api.post<User>("/users", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}
