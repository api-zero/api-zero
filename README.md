# api-zero

<p align="center">
  <strong>The ultra-lightweight, type-safe HTTP client ecosystem for TypeScript and modern React.</strong>
</p>

<p align="center">
  <a href="https://api-zero.vercel.app">Documentation</a> •
  <a href="https://github.com/api-zero/api-zero">GitHub</a> •
  <a href="https://www.npmjs.com/package/@api-zero/core">NPM Core</a> •
  <a href="https://www.npmjs.com/package/@api-zero/react">NPM React</a> •
  <a href="https://www.npmjs.com/package/@api-zero/zod">NPM Zod</a>
</p>

---

## Packages

| Package | Description | Version | Size |
|---------|-------------|---------|------|
| [`@api-zero/core`](packages/core) | Core HTTP client, typed interceptors, smart retry engine with jitter & `Retry-After`, pluggable transports (Fetch / XHR), and rich error handling. | `0.0.1` | ~9 kB |
| [`@api-zero/react`](packages/react) | React 18 & 19 bindings: stable `ApiProvider`, declarative `useRequest` (with auto-abort on unmount/params change), and `useMutation`. | `0.0.1` | ~8 kB |
| [`@api-zero/zod`](packages/zod) | Schema validation, type inference (`z.infer`), `ZodApiClient`, and contracts with `@api-zero/zod`. | `0.0.1` | ~8 kB |

---

## Features

- 🚀 **Zero Overhead**: Built on top of standard Fetch and modern Web APIs, fully compatible with Browser, Node 22+, and Edge runtimes.
- 🔒 **End-to-End Type Safety**: First-class TypeScript generics for response, request body, and query parameters.
- 🔄 **Smart Retry Engine**: Idempotent method protection, exponential/linear backoff, random jitter (anti-thundering herd), and native `Retry-After` header parsing.
- 🛑 **Async Interceptors**: Full lifecycle pipeline with asynchronous request and response interceptors supporting error recovery (e.g. JWT token refresh).
- ⚛️ **Declarative React Hooks**: `useRequest` with automatic abort on unmount/params change, and `useMutation` with full lifecycle callbacks (`onSuccess`, `onError`, `onSettled`).
- 📜 **Zod Contracts**: Seamlessly pass Zod schemas directly to HTTP calls and React hooks for automatic validation and type inference.

---

## Installation

```bash
# Install core
pnpm add @api-zero/core

# With React hooks & provider
pnpm add @api-zero/core @api-zero/react

# With Zod validation
pnpm add @api-zero/core @api-zero/zod zod
```

---

## Quick Start

### 1. Standalone Core Client

```typescript
import { createClient } from "@api-zero/core";

export const api = createClient({
  baseURL: "https://api.example.com",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  retry: {
    attempts: 3,
    delay: 1000,
    jitter: true,
  },
});

interface User {
  id: number;
  name: string;
}

// Full type inference
const users = await api.get<User[]>("/users", {
  params: { role: "admin" },
});
```

### 2. React Integration

```tsx
import { ApiProvider, useRequest, useMutation } from "@api-zero/react";
import React from "react";

function App() {
  return (
    <ApiProvider config={{ baseURL: "https://api.example.com" }}>
      <UserList />
    </ApiProvider>
  );
}

function UserList() {
  const { data: users, loading, error, refetch } = useRequest<User[]>("/users");

  if (loading) return <p>Loading users...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <button onClick={() => refetch()}>Refresh</button>
      <ul>
        {users?.map((user) => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### 3. Zod Validation

```typescript
import { createClient } from "@api-zero/core";
import { zodResponse } from "@api-zero/zod";
import { z } from "zod";

const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  createdAt: z.string().transform((d) => new Date(d)),
});

const client = createClient({ baseURL: "https://api.example.com" });

// 'user' is automatically inferred as { id: number; name: string; createdAt: Date }
const user = await client.get("/users/1", zodResponse(UserSchema));
```

---

## Documentation

Visit the official documentation site at [https://api-zero.vercel.app](https://api-zero.vercel.app) for full guides, interactive examples, and API references.

---

## License

MIT
