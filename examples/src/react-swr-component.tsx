import { ApiError } from "@api-zero/core";
import { useApi } from "@api-zero/react";
import useSWR from "swr";

interface User {
  id: number;
  name: string;
}

export function UserProfile({ id }: { id: number }) {
  const api = useApi();
  const { data, error, isLoading } = useSWR(`/users/${id}`, (url: string) =>
    api.get<User>(url),
  );

  if (isLoading) return <p>Loading…</p>;
  if (error instanceof ApiError && error.isNotFound())
    return <p>No such user</p>;
  return <h1>{data?.name}</h1>;
}
