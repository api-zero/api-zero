import React, { useMemo } from 'react';
import { ApiClientConfig, createClient } from '@api-zero/core';
import { ApiContext } from './context';

export interface ApiProviderProps {
  config: ApiClientConfig;
  children: React.ReactNode;
}

export function ApiProvider({ config, children }: ApiProviderProps) {
  const client = useMemo(() => createClient(config), [config]);

  return (
    <ApiContext.Provider value={client}>
      {children}
    </ApiContext.Provider>
  );
}
