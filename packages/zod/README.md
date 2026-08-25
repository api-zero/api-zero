# @api-zero/zod

Zod runtime contracts and schema validation adapters for `api-zero`.

## Installation

```bash
npm install @api-zero/zod @api-zero/core zod
# or
pnpm add @api-zero/zod @api-zero/core zod
```

## Features

- 🎯 **Full Type Inference**: Automatically infers TypeScript types using `z.infer<typeof schema>`.
- ⚡️ **Zero Bloat in Core**: Keep `@api-zero/core` ultralight and install `@api-zero/zod` only when schema validation is desired.
- 🛡️ **Fail-Fast Outbound Validation**: `zodBody()` validates payloads *before* sending them across the network.
- 🔄 **Automatic Transforms & Coercion**: Fully supports Zod transforms (`.transform()`, `z.coerce`).
- 🚨 **Structured Errors**: `ZodValidationError` extends `ApiError` with `.issues`, `.flatten()`, and `.format()`.

## Usage

### 1. `zodResponse` (Inferred Return Types)

```typescript
import { createClient } from "@api-zero/core";
import { zodResponse } from "@api-zero/zod";
import { z } from "zod";

const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  createdAt: z.string().transform((iso) => new Date(iso)),
});

const client = createClient({ baseURL: "https://api.example.com" });

// user is automatically typed as { id: number; name: string; email: string; createdAt: Date }
const user = await client.get("/users/1", zodResponse(UserSchema));
```

### 2. `zodBody` (Fail-Fast Outbound Validation)

```typescript
import { zodBody } from "@api-zero/zod";

const CreateUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

// Throws ZodValidationError locally without making a network request if body is invalid
const newUser = await client.post(
  "/users",
  { name: "A", email: "invalid" },
  zodBody(CreateUserSchema),
);
```

### 3. `withZod` / `createZodClient` (Fluent Client)

```typescript
import { createZodClient } from "@api-zero/zod";

const api = createZodClient({ baseURL: "https://api.example.com" });

// Direct typed verbs
const user = await api.get("/users/1", UserSchema);
const created = await api.post(
  "/users",
  { name: "Alice", email: "alice@example.com" },
  { response: UserSchema, body: CreateUserSchema },
);
```

### 4. Error Handling with `ZodValidationError`

```typescript
import { ZodValidationError } from "@api-zero/zod";

try {
  await api.get("/users/1", UserSchema);
} catch (error) {
  if (error instanceof ZodValidationError) {
    console.error("Target:", error.target); // 'response' | 'body'
    console.error("Issues:", error.issues);
    console.error("Field errors:", error.flatten().fieldErrors);
  }
}
```

## License

MIT
