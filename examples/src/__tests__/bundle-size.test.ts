import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";

/**
 * Ceilings for the published ESM bundles, gzipped.
 *
 * ADR-001 forbids claiming a bundle size without measuring it, and the docs
 * quote real numbers. This keeps those numbers from quietly becoming false:
 * the budget is a little above the current size, so ordinary growth passes and
 * a jump fails loudly, forcing a conscious decision and a docs update.
 */
const BUDGETS_GZIP_BYTES = {
  "@api-zero/core": 7_000,
  "@api-zero/react": 1_000,
  "@api-zero/zod": 1_600,
} as const;

const DIRS = {
  "@api-zero/core": "core",
  "@api-zero/react": "react",
  "@api-zero/zod": "zod",
} as const;

const root = fileURLToPath(new URL("../../..", import.meta.url));

describe("bundle size", () => {
  for (const [name, budget] of Object.entries(BUDGETS_GZIP_BYTES)) {
    it(`${name} stays within ${budget} B gzipped`, () => {
      const dir = DIRS[name as keyof typeof DIRS];
      const bytes = readFileSync(`${root}/packages/${dir}/dist/index.js`);
      const gzipped = gzipSync(bytes, { level: 9 }).byteLength;
      expect(gzipped).toBeLessThanOrEqual(budget);
    });
  }
});
