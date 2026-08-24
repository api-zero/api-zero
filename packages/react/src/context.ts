import type { ApiClient } from "@api-zero/core";
import { createContext } from "react";

export const ApiContext = createContext<ApiClient | null>(null);
