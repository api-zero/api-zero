import * as core from "@api-zero/core";
import * as react from "@api-zero/react";
import * as zod from "@api-zero/zod";
import { describe, expect, it } from "vitest";

/**
 * A committed snapshot of every runtime export of every published package.
 *
 * This lives here because the examples package is the only workspace member
 * that depends on all three.
 *
 * The point is not to prevent change. It is to make change *deliberate*: adding
 * or removing a public export fails this test until someone updates the list,
 * and that moment is the reminder that the documentation, the examples and the
 * changeset all need attention too. Public API drift is exactly what nobody
 * notices until a consumer's build breaks.
 */
const PUBLIC_SURFACE = {
  "@api-zero/core": [
    "ApiClient",
    "ApiError",
    "FetchTransport",
    "InterceptorManager",
    "XhrTransport",
    "createClient",
  ],
  "@api-zero/react": ["ApiContext", "ApiProvider", "useApi"],
  "@api-zero/zod": [
    "ZodApiClient",
    "ZodValidationError",
    "createZodClient",
    "withZod",
    "zodBody",
    "zodContract",
    "zodResponse",
  ],
} as const;

const modules = {
  "@api-zero/core": core,
  "@api-zero/react": react,
  "@api-zero/zod": zod,
} as const;

describe("public surface", () => {
  for (const [name, expected] of Object.entries(PUBLIC_SURFACE)) {
    it(`${name} exports exactly what is documented`, () => {
      const actual = Object.keys(modules[name as keyof typeof modules]).sort();
      expect(actual).toEqual([...expected].sort());
    });
  }
});
