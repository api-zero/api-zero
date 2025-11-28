import { createContext } from 'react';
import { ApiClient } from '@api-zero/core';

export const ApiContext = createContext<ApiClient | null>(null);
