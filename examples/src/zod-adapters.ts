import { createClient } from "@api-zero/core";
import { zodBody, zodResponse } from "@api-zero/zod";
import { z } from "zod";

const api = createClient({ baseURL: "https://api.example.com" });

const userSchema = z.object({ id: z.number(), name: z.string() });
const createUser = z.object({ name: z.string().min(1) });

// The adapters return plain RequestOptions, so they compose with a
// normal client and with everything else on the options object.
const user = await api.get<z.infer<typeof userSchema>>("/users/1", {
  ...zodResponse(userSchema),
  timeout: 5_000,
});

const created = await api.post(
  "/users",
  { name: "Alice" },
  {
    ...zodBody(createUser),
    ...zodResponse(userSchema),
  },
);
