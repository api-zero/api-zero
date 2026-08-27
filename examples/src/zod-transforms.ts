import { z } from "zod";

// The boundary is where wire formats become domain types. Doing it here rather
// than in each component is the difference between one conversion and twenty.
export const orderSchema = z.object({
  // The API sends a string-encoded decimal to avoid float rounding.
  total: z.string().transform((value) => Number.parseFloat(value)),
  placedAt: z.string().transform((value) => new Date(value)),
  status: z.enum(["pending", "shipped", "delivered"]),
});

export type Order = z.infer<typeof orderSchema>;
