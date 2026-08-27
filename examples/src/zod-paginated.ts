import { createZodClient } from "@api-zero/zod";
import { z } from "zod";

const api = createZodClient({ baseURL: "https://api.example.com" });

const userSchema = z.object({ id: z.number(), name: z.string() });

// An array schema validates every element. Worth it at a boundary you do not
// control; worth measuring when the list has thousands of rows.
const page = await api.get(
  "/users",
  z.object({
    items: z.array(userSchema),
    total: z.number(),
  }),
  { params: { page: 2 } },
);
