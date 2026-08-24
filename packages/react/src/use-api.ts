import type { ApiClient } from "@api-zero/core";
import { useContext } from "react";
import { ApiContext } from "./context";

export function useApi(): ApiClient {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error("useApi must be used within an ApiProvider");
  }
  return context;
}
