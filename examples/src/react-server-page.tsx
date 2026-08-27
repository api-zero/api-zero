import { createRequestClient } from "./react-per-request-client";

interface User {
  name: string;
}

// Server components run per request, so the client is built here with the
// token from this request's own context. They cannot call useApi(): context
// belongs to the client tree.
export async function Page({ token }: { token?: string }) {
  const api = createRequestClient(token);
  const user = await api.get<User>("/me");

  return <h1>{user.name}</h1>;
}
