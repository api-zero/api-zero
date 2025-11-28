# api-zero

**api-zero** is a modern, lightweight, and type-safe HTTP client for React and TypeScript. It is designed to be the perfect companion for data fetching libraries like TanStack Query or SWR, providing a robust foundation for your API interactions.

## Features

- 🚀 **Lightweight & Modern**: Built on top of the native Fetch API.
- 🔒 **Type-Safe**: First-class TypeScript support with generic response types.
- ⚛️ **React Integration**: Dedicated hooks and provider for seamless React usage.
- 🔄 **Smart Retries**: Configurable retry system with exponential backoff.
- 🛑 **Interceptors**: Powerful request and response interceptors.
- 📦 **Modular**: Separate core and React packages.

## Installation

```bash
npm install @api-zero/core @api-zero/react
# or
pnpm add @api-zero/core @api-zero/react
# or
yarn add @api-zero/core @api-zero/react
```

## Quick Start

### 1. Create a Client

```typescript
import { createClient } from '@api-zero/core';

export const api = createClient({
  baseURL: 'https://api.example.com',
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### 2. Use in React

Wrap your app with `ApiProvider`:

```typescript
import { ApiProvider } from '@api-zero/react';
import { api } from './api';

function App() {
  return (
    <ApiProvider config={api.getConfig()}>
      <YourApp />
    </ApiProvider>
  );
}
```

Use the `useApi` hook:

```typescript
import { useApi } from '@api-zero/react';

function UserList() {
  const client = useApi();

  const fetchUsers = async () => {
    const users = await client.get('/users');
    console.log(users);
  };

  return <button onClick={fetchUsers}>Load Users</button>;
}
```

## Documentation

Visit our [documentation site](https://api-zero.vercel.app) for full details, guides, and API reference.

## License

MIT
