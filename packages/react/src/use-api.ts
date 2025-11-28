import { useContext } from 'react';
import { ApiClient } from '@api-zero/core';
import { ApiContext } from './context';

export function useApi(): ApiClient {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within a ApiProvider');
  }
  return context;
}
