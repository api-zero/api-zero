import { createClient } from "@api-zero/core";
import { ApiProvider, useApi } from "@api-zero/react";
import type { ReactNode } from "react";
import type { User } from "./shared";

//#region provider
// Create the client once, outside the component tree, so its identity
// never changes across renders.
const api = createClient({
  baseURL: "https://api.example.com",
  timeout: 10_000,
});

export function Root({ children }: { children: ReactNode }) {
  return <ApiProvider client={api}>{children}</ApiProvider>;
}
//#endregion

//#region use-api
export function SignInButton() {
  const api = useApi();

  async function signIn() {
    const session = await api.post<{ token: string }>("/auth/login", {
      email: "alice@example.com",
      password: "…",
    });
    // Every component shares this client, so the token is now set
    // for the whole tree.
    api.setAuthToken(session.token);
  }

  return (
    <button type="button" onClick={signIn}>
      Sign in
    </button>
  );
}
//#endregion

export function UserName({ user }: { user: User }) {
  return <span>{user.name}</span>;
}
