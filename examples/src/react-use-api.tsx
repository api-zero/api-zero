import { useApi } from "@api-zero/react";

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
