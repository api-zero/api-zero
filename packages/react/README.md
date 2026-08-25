# @api-zero/react

React bindings for `api-zero`: one configured client, available anywhere in the tree.

## What this package is for

Every project ends up with the same hand-written `api.ts`: a client wrapper, a
place to stash the auth token, an interceptor or two, and re-declared `.get` /
`.post` helpers. That file is what this package replaces.

## What it deliberately is not

It is not a data-fetching library. There is no cache, no deduplication, no
invalidation, and no `useQuery` equivalent — those belong to
[TanStack Query](https://tanstack.com/query) or [SWR](https://swr.vercel.app),
which solve them far better than a transport layer should try to.

api-zero is the transport and contract layer underneath them. Pairing the two is
the intended setup, not a workaround.

## Installation

```bash
npm install @api-zero/react @api-zero/core
# or
pnpm add @api-zero/react @api-zero/core
```

## Usage

### 1. Provide the client once

`ApiProvider` accepts either an existing `client` or a `config`. Passing a
client you created yourself is the recommended form: it makes the instance's
lifetime explicit and immune to re-render identity changes.

```tsx
import { createClient } from "@api-zero/core";
import { ApiProvider } from "@api-zero/react";
import App from "./App";

const api = createClient({
  baseURL: "https://api.example.com",
  timeout: 10_000,
});

export default function Root() {
  return (
    <ApiProvider client={api}>
      <App />
    </ApiProvider>
  );
}
```

### 2. Reach it anywhere with `useApi`

```tsx
import { useApi } from "@api-zero/react";

function LoginButton() {
  const api = useApi();

  async function signIn() {
    const session = await api.post<{ token: string }>("/auth/login", {
      email: "alice@example.com",
      password: "…",
    });
    api.setAuthToken(session.token);
  }

  return <button onClick={signIn}>Sign in</button>;
}
```

Every component now shares that client, its headers, its interceptors and its
retry policy. No wrapper module, no token plumbing.

### 3. Combine with TanStack Query

`useApi()` returns the client; hand its request to `queryFn` and forward the
`signal` TanStack provides so cancellation reaches the actual HTTP request.

```tsx
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@api-zero/react";

function useUser(id: number) {
  const api = useApi();

  return useQuery({
    queryKey: ["user", id],
    queryFn: ({ signal }) => api.get<User>(`/users/${id}`, { signal }),
  });
}
```

TanStack owns the cache and the server-state lifecycle. api-zero owns the
request, the errors and the contract. Neither reimplements the other.

## API

| Export | Purpose |
| --- | --- |
| `ApiProvider` | Publishes an `ApiClient` to the tree, from a `client` or a `config`. |
| `useApi()` | Returns the provided client. Throws outside a provider. |
| `ApiContext` | The underlying context, for advanced composition. |

## License

MIT
