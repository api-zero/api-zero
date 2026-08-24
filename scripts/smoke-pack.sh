#!/usr/bin/env bash
set -euo pipefail

# Packs every publishable package and installs the resulting tarballs into a
# throwaway project outside the workspace.
#
# This is the only check that exercises what an npm consumer actually receives:
# the "exports" map, the "files" allowlist and the generated type declarations.
# Inside the monorepo all three are masked by workspace symlinks, so a broken
# exports map or a missing dist file builds and tests green here and fails on
# the first real install.

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

echo "==> Building publishable packages"
pnpm --filter "./packages/*" build >/dev/null

echo "==> Packing tarballs"
for pkg in core react zod; do
  (cd "$ROOT/packages/$pkg" && pnpm pack --pack-destination "$WORK" >/dev/null)
done

CORE_TGZ="$(ls "$WORK"/api-zero-core-*.tgz)"
REACT_TGZ="$(ls "$WORK"/api-zero-react-*.tgz)"
ZOD_TGZ="$(ls "$WORK"/api-zero-zod-*.tgz)"
echo "    $(basename "$CORE_TGZ")"
echo "    $(basename "$REACT_TGZ")"
echo "    $(basename "$ZOD_TGZ")"

CONSUMER="$WORK/consumer"
mkdir -p "$CONSUMER"
cd "$CONSUMER"

echo "==> Installing tarballs in a clean project ($CONSUMER)"
cat > package.json <<'JSON'
{
  "name": "api-zero-consumer-smoke",
  "private": true,
  "version": "0.0.0",
  "type": "module"
}
JSON

npm install --no-audit --no-fund --loglevel=error \
  "$CORE_TGZ" "$REACT_TGZ" "$ZOD_TGZ" \
  react@^18.3.1 react-dom@^18.3.1 zod@^3.24.2 \
  typescript@^5.9.3 @types/react@^18 @types/node@^22 >/dev/null

echo "==> ESM import"
cat > esm.mjs <<'JS'
import { ApiClient, ApiError, createClient, FetchTransport } from "@api-zero/core";
import { ApiProvider, useRequest } from "@api-zero/react";
import { ZodValidationError } from "@api-zero/zod";

const missing = Object.entries({
  ApiClient, ApiError, createClient, FetchTransport,
  ApiProvider, useRequest, ZodValidationError,
}).filter(([, v]) => v === undefined).map(([k]) => k);

if (missing.length > 0) {
  throw new Error(`ESM export(s) missing: ${missing.join(", ")}`);
}

const client = createClient({ baseURL: "https://example.invalid" });
if (typeof client.get !== "function") {
  throw new Error("createClient() did not return a usable client");
}
console.log("    ESM ok");
JS
node esm.mjs

echo "==> CJS require"
cat > cjs.cjs <<'JS'
const core = require("@api-zero/core");
const zod = require("@api-zero/zod");

for (const name of ["ApiClient", "ApiError", "createClient", "FetchTransport"]) {
  if (core[name] === undefined) throw new Error(`CJS export missing: core.${name}`);
}
if (zod.ZodValidationError === undefined) {
  throw new Error("CJS export missing: zod.ZodValidationError");
}
console.log("    CJS ok");
JS
node cjs.cjs

echo "==> Type resolution (module: node16, the strictest consumer setup)"
cat > tsconfig.json <<'JSON'
{
  "compilerOptions": {
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "target": "es2022",
    "module": "node16",
    "moduleResolution": "node16",
    "jsx": "react-jsx",
    "types": ["node"]
  },
  "include": ["types.ts"]
}
JSON
cat > types.ts <<'TS'
import { type ApiClientConfig, ApiError, createClient } from "@api-zero/core";
import type { RequestContext } from "@api-zero/core";
import { z } from "zod";

const config: ApiClientConfig = { baseURL: "https://example.invalid", timeout: 1000 };
const client = createClient(config);

export async function typedCall(): Promise<string> {
  try {
    const user = await client.get<{ name: string }>("/user");
    return user.name;
  } catch (error) {
    if (error instanceof ApiError) {
      return error.message;
    }
    throw error;
  }
}

export const schema = z.object({ name: z.string() });
export type Ctx = RequestContext;
TS
npx --no-install tsc --noEmit -p tsconfig.json
echo "    types ok"

echo "==> Smoke passed"
