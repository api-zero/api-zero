import {
  type ApiClient,
  type ApiClientConfig,
  createClient,
} from "@api-zero/core";
import type React from "react";
import { useMemo, useRef } from "react";
import { ApiContext } from "./context";

export interface ApiProviderProps {
  /**
   * An existing client. Preferred: its lifetime is explicit and its identity
   * cannot change across renders. Wins if `config` is also given.
   */
  client?: ApiClient;
  /**
   * Configuration to build a client from. Compared by contents rather than by
   * identity, so an object literal does not rebuild the client on every render.
   * The comparison is shallow.
   */
  config?: ApiClientConfig;
  /** The subtree that gains access to the client. */
  children: React.ReactNode;
}

/**
 * Checks if two simple config objects are shallowly equivalent
 */
function areConfigsEqual(
  a: ApiClientConfig | undefined,
  b: ApiClientConfig | undefined,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.baseURL !== b.baseURL) return false;
  if (a.timeout !== b.timeout) return false;
  if (a.credentials !== b.credentials) return false;
  if (a.transport !== b.transport) return false;

  const aHeaders = a.headers || {};
  const bHeaders = b.headers || {};
  const aKeys = Object.keys(aHeaders);
  const bKeys = Object.keys(bHeaders);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (aHeaders[key] !== bHeaders[key]) return false;
  }

  return true;
}

export function ApiProvider({ client, config, children }: ApiProviderProps) {
  const clientRef = useRef<ApiClient | null>(null);
  const prevConfigRef = useRef<ApiClientConfig | undefined>(undefined);

  const activeClient = useMemo(() => {
    if (client) {
      return client;
    }

    if (!clientRef.current || !areConfigsEqual(prevConfigRef.current, config)) {
      clientRef.current = createClient(config);
      prevConfigRef.current = config;
    }

    return clientRef.current;
  }, [client, config]);

  return (
    <ApiContext.Provider value={activeClient}>{children}</ApiContext.Provider>
  );
}
