# @api-zero/react

Official React bindings for `api-zero` — featuring `ApiProvider`, `useApi`, `useRequest`, and `useMutation` hooks.

## Installation

```bash
npm install @api-zero/react @api-zero/core
# or
pnpm add @api-zero/react @api-zero/core
```

## Features

- ⚛️ **React 18 & 19 Ready**: Full support for modern React hooks, concurrent rendering, and strict mode.
- 🛡️ **Safe Client Memoization**: `ApiProvider` accepts an existing `client` or `config` with stable memoization across re-renders.
- 📡 **`useRequest`**: Declarative data fetching hook with automatic abort on component unmount and parameter changes.
- ⚡️ **`useMutation`**: Ergonomic mutation hook supporting both `mutate()` and `await mutateAsync()` with full lifecycle callbacks (`onSuccess`, `onError`, `onSettled`).
- 🎯 **Seamless Zod Integration**: Pass `@api-zero/zod` schemas (`zodResponse`, `zodBody`, `zodContract`) directly into React hooks with full static type inference.

## Quick Start

### 1. Setup Provider

```tsx
import { ApiProvider } from "@api-zero/react";
import React from "react";
import App from "./App";

export default function Root() {
  return (
    <ApiProvider config={{ baseURL: "https://api.example.com", timeout: 10000 }}>
      <App />
    </ApiProvider>
  );
}
```

### 2. Fetch Data with `useRequest`

```tsx
import { useRequest } from "@api-zero/react";

interface User {
  id: number;
  name: string;
}

function UserProfile({ userId }: { userId: number }) {
  const { data, loading, error, refetch } = useRequest<User>(`/users/${userId}`);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return null;

  return (
    <div>
      <h1>{data.name}</h1>
      <button onClick={() => refetch()}>Refresh</button>
    </div>
  );
}
```

### 3. Mutate Data with `useMutation`

```tsx
import { useMutation } from "@api-zero/react";

interface CreateUserInput {
  name: string;
  email: string;
}

function CreateUserForm() {
  const { mutate, loading, error, isSuccess, reset } = useMutation<
    { id: number },
    CreateUserInput
  >("/users", "POST", {
    onSuccess: (data) => {
      console.log("User created with ID:", data.id);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate({ name: "Alice", email: "alice@example.com" });
  };

  return (
    <form onSubmit={handleSubmit}>
      <button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create User"}
      </button>
      {isSuccess && <p>User created successfully!</p>}
      {error && <p>Error: {error.message}</p>}
    </form>
  );
}
```

### 4. Integration with `@api-zero/zod`

```tsx
import { useRequest } from "@api-zero/react";
import { zodResponse } from "@api-zero/zod";
import { z } from "zod";

const ProductSchema = z.object({
  id: z.number(),
  title: z.string(),
  price: z.number(),
  createdAt: z.string().transform((d) => new Date(d)),
});

function ProductCard({ id }: { id: number }) {
  // data is fully inferred as { id: number; title: string; price: number; createdAt: Date }!
  const { data, loading } = useRequest(`/products/${id}`, zodResponse(ProductSchema));

  if (loading) return <p>Loading product...</p>;
  return <div>{data?.title} - ${data?.price}</div>;
}
```

## License

MIT
