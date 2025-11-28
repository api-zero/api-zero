# Prompt: Crear "better-call" - Cliente HTTP Moderno para React

## Contexto y Objetivo

Necesito crear **better-call**, un paquete NPM liviano y moderno que simplifique las llamadas HTTP en React. La filosofía es ser un complemento perfecto para TanStack Query o SWR, no reemplazarlos. 

**Visión de uso simple:**
```typescript
const fetchUsers = () => api.get('/users', { params: { page: 1 } });
const createUser = (data) => api.post('/users', data);
```

El paquete debe ser **plug and play** pero totalmente customizable, con tipado TypeScript de primera clase y pensado específicamente para el ecosistema React moderno.

## Código Base Actual (con problemas a resolver)

Tengo este código como punto de partida, pero tiene **acoplamientos que deben eliminarse**:

```typescript
// ❌ PROBLEMAS ACTUALES:
// 1. Query params "language" y "region" están hardcoded
// 2. Modelo ApiResponse está acoplado al proyecto
// 3. localStorage.getItem('i18nextLng') es específico del proyecto
// 4. No hay forma de configurar globalmente headers/tokens

const baseFetch = async <T, B = unknown>(
  endpoint: string,
  method: HttpMethod = 'GET',
  body?: B,
  queryParams?: Record<string, string | undefined>,
  config: RequestConfig = {},
): Promise<ApiResponse<T>> => {
  // ❌ Hardcoded: language y region
  const language = localStorage.getItem('i18nextLng') || navigator.language;
  const region = navigator.language.split('-')[1];
  
  const defaultParams = { language, region }; // ❌ No debería existir
  // ...
};
```

**Lo que SÍ quiero conservar:**
- ✅ Tipado genérico para response, body y query params
- ✅ Sistema de timeout con AbortController
- ✅ Clase ApiError con status y data
- ✅ Headers customizables por petición
- ✅ Métodos get, post, put, delete limpios

## Requerimientos Funcionales Core

### 1. Arquitectura del Paquete

**Nombre**: `better-call`

**Estructura del monorepo** (pnpm + Turbo):
```
better-call/
├── packages/
│   ├── core/                    # El paquete principal
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── react/                   # Hooks de React (opcional pero recomendado)
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
├── apps/
│   ├── docs/                    # Documentación (Next.js + Nextra o similar)
│   └── landing/                 # Landing page
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

### 2. Sistema de Configuración con Provider (React)

**El dilema**: ¿Cómo pasar configuración global (JWT, headers, baseURL) sin perder la capacidad de usar en cualquier parte del código?

**Solución propuesta** - Sistema híbrido con Provider + instancias:

```typescript
// Opción 1: Provider de React (recomendado para apps React)
import { BetterCallProvider, useBetterCall } from 'better-call/react';

function App() {
  return (
    <BetterCallProvider
      config={{
        baseURL: 'https://api.example.com',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        timeout: 30000,
      }}
    >
      <MyApp />
    </BetterCallProvider>
  );
}

// En cualquier componente hijo:
function UserList() {
  const api = useBetterCall();
  
  const { data } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users'), // Ya tiene el token y baseURL
  });
}

// Opción 2: Instancia global (para utils, services, fuera de componentes)
import { createApiClient } from 'better-call';

export const api = createApiClient({
  baseURL: 'https://api.example.com',
  headers: {
    'Authorization': `Bearer ${getToken()}`,
  },
});

// Usar en cualquier parte
const fetchUsers = () => api.get('/users');

// Opción 3: Múltiples instancias
const apiV1 = createApiClient({ baseURL: 'https://api.example.com/v1' });
const apiV2 = createApiClient({ baseURL: 'https://api.example.com/v2' });
const authApi = createApiClient({ baseURL: 'https://auth.example.com' });
```

**Actualización dinámica de config** (ej: después de login):

```typescript
// Desde el Provider
const api = useBetterCall();
api.setConfig({ 
  headers: { 'Authorization': `Bearer ${newToken}` } 
});

// O desde instancia global
api.updateConfig({ 
  headers: { 'Authorization': `Bearer ${newToken}` } 
});

// Helpers específicos para auth
api.setAuthToken(token); // Atajo para Bearer token
api.setBasicAuth(username, password);
api.clearAuth();
```

### 3. API de Métodos HTTP (Limpia y Simple)

Métodos principales con tipado completo:

```typescript
// GET
api.get<ResponseType>(endpoint, options?)
api.get<User[]>('/users', { 
  params: { page: 1, limit: 10 },
  headers: { 'X-Custom': 'value' } // Override global headers
})

// POST
api.post<ResponseType, BodyType>(endpoint, body, options?)
api.post<User, CreateUserDto>('/users', { 
  name: 'John', 
  email: 'john@example.com' 
})

// PUT
api.put<ResponseType, BodyType>(endpoint, body, options?)
api.put<User, UpdateUserDto>('/users/123', { name: 'Jane' })

// PATCH
api.patch<ResponseType, BodyType>(endpoint, body, options?)
api.patch<User, Partial<User>>('/users/123', { name: 'Jane' })

// DELETE
api.delete<ResponseType>(endpoint, options?)
api.delete('/users/123')

// Integración perfecta con TanStack Query
const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => api.get<User[]>('/users'),
  });
};

const useCreateUser = () => {
  return useMutation({
    mutationFn: (data: CreateUserDto) => api.post<User>('/users', data),
  });
};
```

**Options disponibles en cada petición:**
```typescript
interface RequestOptions {
  params?: Record<string, any>;        // Query params
  headers?: Record<string, string>;    // Override headers
  timeout?: number;                    // Override timeout
  signal?: AbortSignal;                // Para cancelación
  baseURL?: string;                    // Override baseURL
  credentials?: RequestCredentials;    // 'include' | 'omit' | 'same-origin'
  onUploadProgress?: (progress: ProgressEvent) => void;
  onDownloadProgress?: (progress: ProgressEvent) => void;
}
```

### 4. Interceptores (Esenciales para Auth y Transformaciones)

Sistema de interceptores **simple pero poderoso**, sin complicar:

```typescript
// Interceptor de request - para añadir tokens, transformar data, etc.
api.interceptors.request.use(
  (config) => {
    // Ejemplo: Añadir timestamp a todas las peticiones
    config.params = { ...config.params, _t: Date.now() };
    return config;
  },
  (error) => {
    // Manejar errores antes de enviar
    return Promise.reject(error);
  }
);

// Interceptor de response - para transformar respuestas, manejar errores globales
api.interceptors.response.use(
  (response) => {
    // Ejemplo: Extraer data de una estructura común
    // Si tu API siempre devuelve { data: {...}, meta: {...} }
    return response.data; // Ahora solo devuelves la data
  },
  async (error) => {
    // Ejemplo: Refresh token automático en 401
    if (error.status === 401 && !error.config._retry) {
      error.config._retry = true;
      
      try {
        const newToken = await refreshToken();
        api.setAuthToken(newToken);
        
        // Reintentar la petición original
        return api.request(error.config);
      } catch (refreshError) {
        // Redirect a login o lo que sea
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// API para gestionar interceptores
const requestInterceptorId = api.interceptors.request.use(...);
api.interceptors.request.eject(requestInterceptorId); // Remover específico

api.interceptors.request.clear(); // Limpiar todos
```

**Casos de uso comunes para incluir en docs:**
1. Auto-refresh de tokens
2. Añadir headers dinámicos
3. Transformar snake_case ↔ camelCase
4. Logging de peticiones
5. Manejo global de errores (ej: mostrar toast)

### 5. Sistema de Retry (Opcional pero útil)

**Importante**: Como usarás TanStack Query o SWR, ellos ya manejan retry. Pero añadir retry a nivel de cliente puede ser útil para errores de red transitorios.

```typescript
// Config global
const api = createApiClient({
  baseURL: 'https://api.example.com',
  retry: {
    attempts: 3,
    delay: 1000,
    backoff: 'exponential', // 1s, 2s, 4s...
    retryCondition: (error) => {
      // Solo reintentar errores de red o 5xx
      return error.isNetworkError || error.status >= 500;
    },
  },
});

// Override por petición
api.get('/users', { 
  retry: { attempts: 5 } // Esta petición específica reintenta 5 veces
});

// Desactivar retry en una petición
api.post('/users', data, { 
  retry: false 
});
```

**Estrategias de backoff:**
- `linear`: 1s, 2s, 3s...
- `exponential`: 1s, 2s, 4s, 8s...
- `function`: Custom `(attempt) => attempt * 1000`

## Features Avanzadas (Opcionales - Solo si queda tiempo)

Estas features son **nice to have** pero no esenciales para v1. Úsalas como inspiración si sobra tiempo:

### Cache (TanStack Query ya lo hace mejor)
```typescript
// Solo mencionar que NO es necesario implementar cache
// porque TanStack Query / SWR ya lo manejan perfectamente
```

### Rate Limiting (Low priority)
```typescript
{
  rateLimit: {
    maxRequests: 10,
    perMilliseconds: 1000,
    queueRequests: true,
  }
}
```

### Request Deduplication (Low priority)
```typescript
{
  dedupe: true, // Evitar peticiones duplicadas simultáneas
}
```

### Métricas y Monitoreo (Low priority)
```typescript
api.metrics.on('request', (metrics) => {
  // duration, url, method, status...
});
```

### Mock/Testing Helpers (Nice to have)
```typescript
// Para tests
api.mock.onGet('/users').reply(200, [{ id: 1, name: 'John' }]);
api.mock.restore();
```

### 11. Transformaciones de Datos (Opcional pero útil)

```typescript
// Transform request data (ej: camelCase → snake_case)
const api = createApiClient({
  baseURL: 'https://api.example.com',
  transformRequest: [(data) => {
    return transformKeys(data, toSnakeCase);
  }],
  transformResponse: [(data) => {
    return transformKeys(data, toCamelCase);
  }],
});

// Ejemplo con librería externa
import { camelCase, snakeCase } from 'change-case-object';

const api = createApiClient({
  baseURL: 'https://api.example.com',
  transformRequest: [camelCase],
  transformResponse: [snakeCase],
});

// Ahora puedes escribir:
api.post('/users', { firstName: 'John', lastName: 'Doe' });
// Envía: { first_name: 'John', last_name: 'Doe' }

// Y recibes:
const user = await api.get('/users/1');
// user = { firstName: 'John', lastName: 'Doe' }
// (aunque el servidor devuelva snake_case)
```

### 8. Query Params Inteligentes

Serialización flexible de query params:

```typescript
// Objeto simple
api.get('/users', { 
  params: { 
    page: 1, 
    limit: 10,
    status: 'active' 
  } 
});
// → /users?page=1&limit=10&status=active

// Arrays (diferentes formatos)
api.get('/users', { 
  params: { 
    ids: [1, 2, 3],
    tags: ['javascript', 'typescript']
  },
  paramsSerializer: {
    arrayFormat: 'brackets' // ids[]=1&ids[]=2&ids[]=3
    // 'repeat': ids=1&ids=2&ids=3
    // 'comma': ids=1,2,3
  }
});

// Filtrar valores null/undefined automáticamente
api.get('/users', { 
  params: { 
    name: 'John',
    age: undefined,  // ← Se ignora
    city: null,      // ← Se ignora
  } 
});
// → /users?name=John

// Encoding automático
api.get('/search', { 
  params: { 
    q: 'hello world',  // → q=hello%20world
    filter: 'name:john' 
  } 
});
```

### 6. Manejo de Errores Robusto

Clase de error rica en información:

```typescript
class BetterCallError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string,
    public data?: unknown,           // Response body del error
    public config?: RequestConfig,   // Config de la petición que falló
    public isTimeout = false,
    public isNetworkError = false,
    public isAborted = false,
  ) {
    super(message);
    this.name = 'BetterCallError';
  }

  // Helper para verificar tipos de error
  is4xx() { return this.status >= 400 && this.status < 500; }
  is5xx() { return this.status >= 500; }
  isUnauthorized() { return this.status === 401; }
  isForbidden() { return this.status === 403; }
  isNotFound() { return this.status === 404; }
  
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      statusText: this.statusText,
      data: this.data,
    };
  }
}

// Uso con TanStack Query
const { data, error } = useQuery({
  queryKey: ['users'],
  queryFn: () => api.get('/users'),
});

if (error instanceof BetterCallError) {
  if (error.isUnauthorized()) {
    // Redirect a login
  }
  if (error.isTimeout) {
    // Mostrar mensaje de timeout
  }
  console.log(error.data); // Body del error del servidor
}
```

### 7. Timeouts y Cancelación

```typescript
// Timeout global (default: 30s)
const api = createApiClient({
  baseURL: 'https://api.example.com',
  timeout: 30000,
});

// Override timeout por petición
api.get('/slow-endpoint', { timeout: 60000 });

// Cancelación manual con AbortController
const controller = new AbortController();
api.get('/users', { signal: controller.signal });

// Cancelar después de 5 segundos
setTimeout(() => controller.abort(), 5000);

// Hook de React para auto-cancelar al desmontar
function UserList() {
  const api = useBetterCall();
  
  useEffect(() => {
    const controller = new AbortController();
    
    api.get('/users', { signal: controller.signal })
      .then(setUsers)
      .catch(error => {
        if (!error.isAborted) {
          console.error(error);
        }
      });
    
    return () => controller.abort(); // Cleanup
  }, []);
}

// O con TanStack Query (maneja cancelación automáticamente)
const { data } = useQuery({
  queryKey: ['users'],
  queryFn: ({ signal }) => api.get('/users', { signal }),
});
```

### 9. Progress Tracking (Uploads/Downloads)

```typescript
// Upload con progreso
const handleUpload = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  await api.post('/upload', formData, {
    onUploadProgress: (progressEvent) => {
      const percent = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );
      setUploadProgress(percent);
    },
  });
};

// Download con progreso
const handleDownload = async () => {
  const blob = await api.get('/files/report.pdf', {
    responseType: 'blob',
    onDownloadProgress: (progressEvent) => {
      const percent = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );
      setDownloadProgress(percent);
    },
  });
  
  // Descargar archivo
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'report.pdf';
  a.click();
};
```

### 10. Autenticación (Helpers Convenientes)

```typescript
// Bearer Token (caso más común)
api.setAuthToken(token);
// Internamente añade: headers['Authorization'] = `Bearer ${token}`

api.clearAuth();
// Limpia el header de autorización

// Basic Auth
api.setBasicAuth(username, password);
// Internamente: headers['Authorization'] = `Basic ${btoa(`${username}:${password}`)}`

// Custom headers
api.setHeader('X-API-Key', apiKey);
api.removeHeader('X-API-Key');

// Actualizar headers masivamente
api.updateHeaders({
  'X-Custom-1': 'value1',
  'X-Custom-2': 'value2',
});

// OAuth2 con auto-refresh (avanzado, opcional)
api.setOAuth2({
  accessToken: token,
  refreshToken: refreshToken,
  onTokenRefresh: async (refreshToken) => {
    const { accessToken, refreshToken: newRefreshToken } = 
      await refreshAccessToken(refreshToken);
    
    return { accessToken, refreshToken: newRefreshToken };
  },
});
```

**Ejemplo real: Login flow**
```typescript
// 1. Login
const { token } = await api.post('/auth/login', { email, password });

// 2. Guardar token
localStorage.setItem('token', token);
api.setAuthToken(token);

// 3. Desde este momento, todas las peticiones llevan el token

// 4. Logout
api.clearAuth();
localStorage.removeItem('token');
```

### 14. Request Queue

Cola de peticiones con priorización:

```typescript
{
  queue: {
    enabled: true,
    concurrency: 5, // Max peticiones simultáneas
    priority: (config) => config.priority || 0, // Mayor = más prioridad
    onQueueChange: (queueLength) => {
      console.log(`Queue length: ${queueLength}`);
    }
  }
}
```

### 12. Logging y Debug

```typescript
const api = createApiClient({
  baseURL: 'https://api.example.com',
  debug: true, // Activa logging automático
  logger: {
    request: (config) => {
      console.log(`→ ${config.method} ${config.url}`, config);
    },
    response: (response) => {
      console.log(`← ${response.status} ${response.statusText}`, response);
    },
    error: (error) => {
      console.error(`✗ ${error.message}`, error);
    },
  },
});

// También eventos custom
api.on('request:start', (config) => {
  // Track analytics, loading spinners, etc.
});

api.on('request:end', (response) => {
  // Hide loading, track performance, etc.
});

api.on('request:error', (error) => {
  // Global error handling, toast notifications, etc.
});
```

### 16. Validación de Respuestas

Integración con schemas de validación (Zod, Yup, etc.):

```typescript
import { z } from 'zod';

const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
});

const response = await api.get('/users/1', {}, {
  validateResponse: UserSchema,
  onValidationError: (error) => {
    console.error('Validation failed:', error);
  }
});
```

### 17. Mock y Testing

Facilidades para testing:

```typescript
// Mock de respuestas
api.mock.onGet('/users').reply(200, { data: [...] });
api.mock.onPost('/users').reply(201);
api.mock.restore(); // Restaurar comportamiento normal

// Modo de desarrollo
api.setMockMode(true);
api.addMockResponse('/users', { data: [...] }, { delay: 500 });
```

### 18. Helpers de URL

Utilidades para construcción de URLs:

```typescript
api.buildUrl('/users/:id', { id: 123 }); // '/users/123'
api.buildUrl('/search', {}, { q: 'test', page: 1 }); // '/search?q=test&page=1'
api.getBaseUrl(); // Obtener baseURL actual
api.setBaseUrl(newUrl); // Cambiar baseURL
```

## Tipos TypeScript (Super Importantes)

Tipado exhaustivo sin usar `any` en ningún lugar:

```typescript
// Config principal
interface BetterCallConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
  retry?: RetryConfig | false;
  debug?: boolean;
  logger?: LoggerConfig;
  transformRequest?: Array<(data: any) => any>;
  transformResponse?: Array<(data: any) => any>;
  paramsSerializer?: ParamsSerializerConfig;
}

// Opciones por petición (extienden config global)
interface RequestOptions<TParams = Record<string, any>> {
  params?: TParams;
  headers?: Record<string, string>;
  timeout?: number;
  signal?: AbortSignal;
  baseURL?: string;
  credentials?: RequestCredentials;
  retry?: RetryConfig | false;
  responseType?: 'json' | 'text' | 'blob' | 'arrayBuffer';
  onUploadProgress?: (progress: ProgressEvent) => void;
  onDownloadProgress?: (progress: ProgressEvent) => void;
}

// Métodos del cliente
interface BetterCallClient {
  get<TResponse = any, TParams = Record<string, any>>(
    endpoint: string,
    options?: RequestOptions<TParams>
  ): Promise<TResponse>;

  post<TResponse = any, TBody = any, TParams = Record<string, any>>(
    endpoint: string,
    data: TBody,
    options?: RequestOptions<TParams>
  ): Promise<TResponse>;

  put<TResponse = any, TBody = any, TParams = Record<string, any>>(
    endpoint: string,
    data: TBody,
    options?: RequestOptions<TParams>
  ): Promise<TResponse>;

  patch<TResponse = any, TBody = any, TParams = Record<string, any>>(
    endpoint: string,
    data: TBody,
    options?: RequestOptions<TParams>
  ): Promise<TResponse>;

  delete<TResponse = any, TParams = Record<string, any>>(
    endpoint: string,
    options?: RequestOptions<TParams>
  ): Promise<TResponse>;

  // Config methods
  setAuthToken(token: string): void;
  clearAuth(): void;
  setBasicAuth(username: string, password: string): void;
  setHeader(key: string, value: string): void;
  removeHeader(key: string): void;
  updateHeaders(headers: Record<string, string>): void;
  setConfig(config: Partial<BetterCallConfig>): void;
  getConfig(): BetterCallConfig;

  // Interceptors
  interceptors: {
    request: InterceptorManager<RequestConfig>;
    response: InterceptorManager<Response>;
  };

  // Events
  on(event: 'request:start', handler: (config: RequestConfig) => void): void;
  on(event: 'request:end', handler: (response: Response) => void): void;
  on(event: 'request:error', handler: (error: BetterCallError) => void): void;
  off(event: string, handler: Function): void;
}

// Error tipado
class BetterCallError extends Error {
  readonly name = 'BetterCallError';
  
  constructor(
    message: string,
    public readonly status: number,
    public readonly statusText: string,
    public readonly data?: unknown,
    public readonly config?: RequestConfig,
    public readonly isTimeout = false,
    public readonly isNetworkError = false,
    public readonly isAborted = false,
  ) {
    super(message);
  }

  is4xx(): boolean;
  is5xx(): boolean;
  isUnauthorized(): boolean;
  isForbidden(): boolean;
  isNotFound(): boolean;
  toJSON(): Record<string, any>;
}

// Funciones principales exportadas
export function createApiClient(config: BetterCallConfig): BetterCallClient;
export { BetterCallError };
export type { 
  BetterCallConfig, 
  RequestOptions, 
  BetterCallClient,
  RetryConfig,
  LoggerConfig,
};

// Para React
export function BetterCallProvider(props: {
  config: BetterCallConfig;
  children: React.ReactNode;
}): JSX.Element;

export function useBetterCall(): BetterCallClient;
```

### 20. Plugins y Extensibilidad

Sistema de plugins para extender funcionalidad:

```typescript
const authPlugin = {
  name: 'auth',
  onRequest: (config) => {
    config.headers['Authorization'] = `Bearer ${getToken()}`;
    return config;
  },
  onResponse: (response) => response,
  onError: async (error) => {
    if (error.status === 401) {
      await refreshToken();
      return api.request(error.config); // Retry
    }
    throw error;
  }
};

api.use(authPlugin);
api.eject('auth'); // Remover plugin
```

### 21. Métricas y Monitoreo

Sistema para trackear métricas:

```typescript
api.metrics.on('request', (metrics) => {
  console.log({
    duration: metrics.duration,
    url: metrics.url,
    method: metrics.method,
    status: metrics.status,
  });
});

const stats = api.metrics.getStats();
// {
//   totalRequests: 150,
//   successRate: 0.95,
//   averageResponseTime: 250,
//   errorRate: 0.05,
// }
```

### 22. Adaptadores

Soportar diferentes motores HTTP:

```typescript
{
  adapter: 'fetch', // 'fetch' | 'xhr' | 'node' | custom
  customAdapter: async (config) => {
    // Implementación custom
  }
}
```

## Requerimientos No Funcionales

### Calidad del Código
- ✅ **TypeScript estricto**: `strict: true`, sin `any` (usar `unknown` si es necesario)
- ✅ **Bundle size**: < 30KB gzipped (sin dependencias pesadas)
- ✅ **Tree-shakeable**: Permitir importaciones selectivas
- ✅ **Zero dependencies**: Core sin dependencias (opcional alguna dev dependency)
- ✅ **ESM y CommonJS**: Soportar ambos formatos
- ✅ **JSDoc completo**: Documentar todas las APIs públicas

### Testing
- ✅ **Tests unitarios**: Vitest, cobertura > 80%
- ✅ **Tests de integración**: Casos reales con MSW (Mock Service Worker)
- ✅ **Tests de tipos**: Validar tipado con `tsd` o `expect-type`

### Documentación
- ✅ **README completo**: Con ejemplos de uso básico
- ✅ **Docs site**: Next.js + Nextra en `/apps/docs`
  - Getting Started
  - API Reference (auto-generada con TypeDoc)
  - Recipes (casos comunes: auth, uploads, error handling, etc.)
  - Integrations (TanStack Query, SWR)
  - Migration (desde fetch, Axios)
- ✅ **Landing page**: En `/apps/landing`
  - Hero con ejemplo de código
  - Features principales
  - Comparación con Axios (tamaño, DX, modernidad)
  - Quick start

### Build y Distribución
- ✅ **Bundle moderno**: tsup (rápido, simple)
- ✅ **Múltiples formatos**: 
  - ESM: `dist/index.mjs`
  - CommonJS: `dist/index.cjs`
  - Types: `dist/index.d.ts`
- ✅ **Source maps**: Incluir para debugging
- ✅ **package.json exports**:
  ```json
  {
    "exports": {
      ".": {
        "import": "./dist/index.mjs",
        "require": "./dist/index.cjs",
        "types": "./dist/index.d.ts"
      },
      "./react": {
        "import": "./dist/react.mjs",
        "require": "./dist/react.cjs",
        "types": "./dist/react.d.ts"
      }
    }
  }
  ```

### Performance
- ✅ **Lazy loading**: Features opcionales cargadas bajo demanda si es posible
- ✅ **Memory leaks**: Limpiar listeners, timers, AbortControllers
- ✅ **HTTP/2**: Aprovechar multiplexing cuando esté disponible

### Compatibilidad
- ✅ **Browsers**: Últimas 2 versiones de Chrome, Firefox, Safari, Edge
- ✅ **Node.js**: >= 18 (usa fetch nativo)
- ✅ **React**: >= 18 (para el paquete `better-call/react`)
- ✅ **React Native**: Funcionar correctamente
- ✅ **SSR**: Next.js, Remix (sin uso de localStorage/window sin checks)

## Extras y Consideraciones Técnicas

### Manejo de Diferentes Response Types
```typescript
// JSON (default)
const data = await api.get<User>('/users/1');

// Text
const text = await api.get<string>('/health', { 
  responseType: 'text' 
});

// Blob (para archivos)
const blob = await api.get<Blob>('/files/report.pdf', { 
  responseType: 'blob' 
});

// ArrayBuffer
const buffer = await api.get<ArrayBuffer>('/binary', { 
  responseType: 'arrayBuffer' 
});
```

### Error Handling Best Practices
```typescript
// Global error handler via interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log to monitoring service
    if (process.env.NODE_ENV === 'production') {
      logToSentry(error);
    }
    
    // Show toast for user-facing errors
    if (error.is4xx() && !error.isUnauthorized()) {
      toast.error(error.data?.message || error.message);
    }
    
    // Network errors
    if (error.isNetworkError) {
      toast.error('No internet connection');
    }
    
    return Promise.reject(error);
  }
);

// Component-level error handling
try {
  const user = await api.get<User>('/users/1');
  // ...
} catch (error) {
  if (error instanceof BetterCallError) {
    if (error.isNotFound()) {
      // Handle 404
    } else if (error.isUnauthorized()) {
      // Redirect to login
    } else if (error.isTimeout) {
      // Show retry button
    }
  }
}
```

### SSR Considerations
```typescript
// Next.js App Router example
// app/users/page.tsx
export default async function UsersPage() {
  const api = createApiClient({
    baseURL: process.env.NEXT_PUBLIC_API_URL!,
  });
  
  const users = await api.get<User[]>('/users');
  
  return <UserList users={users} />;
}

// Con cookies para auth en SSR
import { cookies } from 'next/headers';

export default async function DashboardPage() {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;
  
  const api = createApiClient({
    baseURL: process.env.NEXT_PUBLIC_API_URL!,
    headers: token ? {
      'Authorization': `Bearer ${token}`
    } : {},
  });
  
  const data = await api.get<DashboardData>('/dashboard');
  
  return <Dashboard data={data} />;
}
```

### Environment Variables
Mostrar en docs cómo configurar para diferentes entornos:

```typescript
// .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000/api

// .env.production
NEXT_PUBLIC_API_URL=https://api.production.com

// Uso
const api = createApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://api.example.com',
  timeout: 30000,
});
```

### Testing with MSW (Mock Service Worker)
Incluir ejemplo en docs:

```typescript
// tests/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('https://api.example.com/users', () => {
    return HttpResponse.json([
      { id: 1, name: 'John Doe' },
      { id: 2, name: 'Jane Doe' },
    ]);
  }),
  
  http.post('https://api.example.com/users', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      { id: 3, ...body },
      { status: 201 }
    );
  }),
];

// tests/setup.ts
import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers';

export const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// tests/api.test.ts
import { api } from '../src/api';

describe('API Client', () => {
  it('fetches users', async () => {
    const users = await api.get<User[]>('/users');
    expect(users).toHaveLength(2);
    expect(users[0].name).toBe('John Doe');
  });
});
```

### Performance Tips para Docs
```typescript
// ❌ No hagas esto (crea nueva instancia en cada render)
function Component() {
  const api = createApiClient({ baseURL: '...' });
  // ...
}

// ✅ Haz esto (crea fuera del componente o usa Provider)
const api = createApiClient({ baseURL: '...' });

function Component() {
  // Usa la instancia global o el hook
  const { data } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users'),
  });
}

// O mejor aún, usa el Provider
function Component() {
  const api = useBetterCall(); // Reutiliza la misma instancia
}
```

### Migration from Axios
Incluir en docs una guía de migración:

```typescript
// Before (Axios)
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.example.com',
});

api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

const response = await api.get('/users');
const users = response.data;

// After (better-call)
import { createApiClient } from 'better-call';

const api = createApiClient({
  baseURL: 'https://api.example.com',
});

api.setAuthToken(token);

const users = await api.get<User[]>('/users');
// Nota: Ya devuelve la data directamente, no necesitas .data

// Interceptors (similar)
api.interceptors.request.use((config) => {
  // Mismo API que Axios
  return config;
});
```

### Seguridad
Incluir nota en docs sobre mejores prácticas:

```typescript
// ❌ NO expongas tokens en el código
const api = createApiClient({
  headers: {
    'Authorization': 'Bearer hardcoded-token-123', // ❌ Nunca hagas esto
  },
});

// ✅ Usa variables de entorno o storage seguro
const api = createApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Obtén el token de forma segura
const token = await getTokenFromSecureStorage();
api.setAuthToken(token);

// ✅ En producción, usa httpOnly cookies cuando sea posible
const api = createApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  credentials: 'include', // Envía cookies automáticamente
});
```

## Estructura del Monorepo

```
better-call/
├── packages/
│   ├── core/                          # Paquete principal
│   │   ├── src/
│   │   │   ├── client.ts             # Clase principal BetterCallClient
│   │   │   ├── request.ts            # Lógica de fetch
│   │   │   ├── error.ts              # BetterCallError
│   │   │   ├── interceptors.ts       # Sistema de interceptores
│   │   │   ├── retry.ts              # Lógica de retry
│   │   │   ├── auth.ts               # Helpers de autenticación
│   │   │   ├── params.ts             # Serialización de query params
│   │   │   ├── progress.ts           # Upload/download progress
│   │   │   ├── events.ts             # Sistema de eventos
│   │   │   ├── types.ts              # Todos los tipos
│   │   │   └── index.ts              # Exports públicos
│   │   ├── tests/
│   │   │   ├── client.test.ts
│   │   │   ├── interceptors.test.ts
│   │   │   ├── retry.test.ts
│   │   │   └── ...
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── tsup.config.ts
│   │   └── README.md
│   │
│   └── react/                         # Hooks de React
│       ├── src/
│       │   ├── provider.tsx          # BetterCallProvider
│       │   ├── use-better-call.ts    # useBetterCall hook
│       │   ├── types.ts
│       │   └── index.ts
│       ├── tests/
│       ├── package.json
│       └── tsconfig.json
│
├── apps/
│   ├── docs/                          # Documentación (Next.js + Nextra)
│   │   ├── pages/
│   │   │   ├── index.mdx             # Home
│   │   │   ├── getting-started.mdx
│   │   │   ├── api/
│   │   │   │   ├── client.mdx
│   │   │   │   ├── interceptors.mdx
│   │   │   │   └── ...
│   │   │   ├── recipes/
│   │   │   │   ├── authentication.mdx
│   │   │   │   ├── file-uploads.mdx
│   │   │   │   ├── error-handling.mdx
│   │   │   │   └── tanstack-query.mdx
│   │   │   └── migration.mdx
│   │   ├── components/
│   │   ├── package.json
│   │   └── next.config.js
│   │
│   └── landing/                       # Landing page
│       ├── app/
│       ├── components/
│       ├── package.json
│       └── next.config.js
│
├── pnpm-workspace.yaml
├── turbo.json
├── package.json                       # Root package.json
├── .gitignore
├── .prettierrc
├── .eslintrc.js
└── README.md                          # Intro y links a docs
```

### pnpm-workspace.yaml
```yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

### turbo.json
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["build"]
    },
    "lint": {},
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

### Root package.json
```json
{
  "name": "better-call",
  "private": true,
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "format": "prettier --write \"**/*.{ts,tsx,md}\""
  },
  "devDependencies": {
    "turbo": "latest",
    "prettier": "latest",
    "typescript": "latest"
  }
}
```

## Ejemplo de API Final

```typescript
// ============================================
// Instalación
// ============================================
// npm install better-call
// pnpm add better-call

// ============================================
// Setup básico (sin React)
// ============================================
import { createApiClient } from 'better-call';

const api = createApiClient({
  baseURL: 'https://api.example.com',
  timeout: 30000,
});

// Login y guardar token
const login = async (email: string, password: string) => {
  const { token } = await api.post<{ token: string }>('/auth/login', {
    email,
    password,
  });
  
  localStorage.setItem('token', token);
  api.setAuthToken(token);
};

// Uso simple
const fetchUsers = () => api.get<User[]>('/users');
const createUser = (data: CreateUserDto) => api.post<User>('/users', data);

// ============================================
// Setup con React Provider
// ============================================
import { BetterCallProvider } from 'better-call/react';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  
  return (
    <BetterCallProvider
      config={{
        baseURL: 'https://api.example.com',
        timeout: 30000,
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {},
      }}
    >
      <AuthContext.Provider value={{ setToken }}>
        <MyApp />
      </AuthContext.Provider>
    </BetterCallProvider>
  );
}

// En cualquier componente
function UserList() {
  const api = useBetterCall();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get<User[]>('/users', {
      params: { page: 1, limit: 10 }
    }),
  });
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <ul>
      {data.map(user => <li key={user.id}>{user.name}</li>)}
    </ul>
  );
}

// ============================================
// Interceptores para refresh token
// ============================================
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.status === 401 && !error.config._retry) {
      error.config._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { accessToken } = await api.post('/auth/refresh', { 
          refreshToken 
        });
        
        localStorage.setItem('token', accessToken);
        api.setAuthToken(accessToken);
        
        // Reintentar petición original
        return api.request(error.config);
      } catch (refreshError) {
        // Logout
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// ============================================
// Upload con progreso
// ============================================
function FileUpload() {
  const api = useBetterCall();
  const [progress, setProgress] = useState(0);
  
  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      await api.post('/upload', formData, {
        onUploadProgress: (e) => {
          setProgress(Math.round((e.loaded * 100) / e.total));
        },
      });
      
      toast.success('File uploaded!');
    } catch (error) {
      toast.error('Upload failed');
    }
  };
  
  return (
    <div>
      <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />
      {progress > 0 && <progress value={progress} max={100} />}
    </div>
  );
}

// ============================================
// Transformaciones automáticas
// ============================================
const api = createApiClient({
  baseURL: 'https://api.example.com',
  transformRequest: [(data) => transformKeysToSnakeCase(data)],
  transformResponse: [(data) => transformKeysToCamelCase(data)],
});

// Ahora puedes escribir camelCase en tu código
api.post('/users', { 
  firstName: 'John',  // Se envía como first_name
  lastName: 'Doe'     // Se envía como last_name
});

// ============================================
// Logging y debug
// ============================================
const api = createApiClient({
  baseURL: 'https://api.example.com',
  debug: process.env.NODE_ENV === 'development',
  logger: {
    request: (config) => {
      console.log(`→ ${config.method} ${config.url}`);
    },
    response: (response) => {
      console.log(`← ${response.status}`);
    },
    error: (error) => {
      if (error.isTimeout) {
        console.error('Request timeout');
      } else if (error.isNetworkError) {
        console.error('Network error');
      } else {
        console.error(`Error ${error.status}: ${error.message}`);
      }
    },
  },
});

// ============================================
// Retry automático
// ============================================
const api = createApiClient({
  baseURL: 'https://api.example.com',
  retry: {
    attempts: 3,
    delay: 1000,
    backoff: 'exponential',
    retryCondition: (error) => {
      // Solo reintentar errores de servidor o red
      return error.isNetworkError || error.status >= 500;
    },
  },
});

// ============================================
// Cancelación
// ============================================
function SearchResults() {
  const api = useBetterCall();
  const [results, setResults] = useState([]);
  
  useEffect(() => {
    const controller = new AbortController();
    
    api.get('/search', { 
      params: { q: query },
      signal: controller.signal 
    })
      .then(setResults)
      .catch(error => {
        if (!error.isAborted) {
          console.error(error);
        }
      });
    
    return () => controller.abort(); // Cleanup
  }, [query]);
  
  return <div>{/* ... */}</div>;
}

// O con TanStack Query (maneja cancelación automáticamente)
const { data } = useQuery({
  queryKey: ['search', query],
  queryFn: ({ signal }) => api.get('/search', { 
    params: { q: query },
    signal 
  }),
});

// ============================================
// Múltiples instancias
// ============================================
const apiV1 = createApiClient({ 
  baseURL: 'https://api.example.com/v1' 
});

const apiV2 = createApiClient({ 
  baseURL: 'https://api.example.com/v2' 
});

const authApi = createApiClient({ 
  baseURL: 'https://auth.example.com',
  timeout: 10000,
});
```

## Criterios de Éxito

El paquete será exitoso si cumple:

1. ✅ **Developer Experience**: 
   - Setup en < 5 minutos
   - Código más limpio que usar fetch directamente
   - TypeScript inference automático sin necesidad de anotaciones manuales
   - Errores claros y útiles

2. ✅ **Tamaño**:
   - Core < 20KB gzipped
   - Más ligero que Axios (300KB) y ky (50KB)
   - Tree-shakeable para reducir aún más

3. ✅ **Integración React**:
   - Provider opcional pero útil
   - Compatible con TanStack Query y SWR
   - Hooks simples y composables

4. ✅ **TypeScript**:
   - Sin usar `any` en ninguna parte
   - Inference completo
   - Errores de tipo claros

5. ✅ **Documentación**:
   - README con quick start
   - Docs site completo
   - Ejemplos de casos comunes
   - Recipes para patrones típicos

6. ✅ **Testing**:
   - > 80% coverage
   - Tests de integración con MSW
   - Tests de tipos

7. ✅ **Performance**:
   - Sin memory leaks
   - Sin dependencias innecesarias
   - Usa APIs nativas cuando es posible

## Prioridades de Implementación

### Phase 1: MVP (Lo esencial)
1. ✅ Core client con métodos HTTP (GET, POST, PUT, PATCH, DELETE)
2. ✅ Config flexible (baseURL, headers, timeout)
3. ✅ Sistema de tipos completo
4. ✅ BetterCallError con toda la info
5. ✅ Timeout y cancelación
6. ✅ Query params con serialización
7. ✅ Helpers de auth (setAuthToken, etc.)
8. ✅ Build setup (tsup, ESM + CJS)

### Phase 2: Core Features
9. ✅ Interceptores (request + response)
10. ✅ Retry con backoff
11. ✅ Progress tracking (upload/download)
12. ✅ Transformaciones (request/response)
13. ✅ React Provider + hook
14. ✅ Sistema de eventos (on/off)
15. ✅ Logger configurable

### Phase 3: Polish & Docs
16. ✅ Tests unitarios + integración
17. ✅ Docs site (Nextra)
18. ✅ Landing page
19. ✅ Migration guide
20. ✅ Recipes comunes

### Phase 4: Nice to Have (Opcional)
21. ⚠️ Validación de responses (Zod integration)
22. ⚠️ Mock helpers para testing
23. ⚠️ Rate limiting
24. ⚠️ Request deduplication
25. ⚠️ Métricas y monitoreo

## Respuestas a las Preguntas Finales

### ¿Necesitas soporte para FormData/File uploads?
**Sí**, es esencial. Incluir:
- Detección automática de FormData (no enviar Content-Type, dejar que el browser lo maneje)
- Progress tracking con `onUploadProgress`
- Ejemplo en docs de cómo subir archivos

### ¿Integración específica con React?
**Sí**, pero en paquete separado:
- `better-call` → Core (framework-agnostic)
- `better-call/react` → Provider + hooks

### ¿Soporte para proxies o custom agents?
**No es prioridad**. El 95% de casos de uso son en browser. Si alguien lo necesita en Node.js, puede usar un adapter custom (dejarlo extensible).

### ¿Librería de validación preferida?
**Agnóstico**, pero mostrar ejemplo con Zod en docs porque es la más popular actualmente en el ecosistema TypeScript.

### ¿Generación de tipos desde OpenAPI?
**No incluir** en v1, pero mencionar en roadmap. Es una feature muy útil pero añade complejidad. Mejor hacerlo como paquete separado más adelante (`better-call-codegen`).

---

## Nota Final para Antigravity

Este prompt describe **better-call**, un cliente HTTP moderno, ligero y orientado a React que sirve como complemento perfecto para TanStack Query o SWR.

**Filosofía de diseño:**
- 🎯 **Simple pero poderoso**: API limpia que cubre 95% de casos de uso
- 🪶 **Ligero**: < 30KB gzipped sin dependencias
- 🔷 **TypeScript first**: Sin `any`, inference completo
- ⚛️ **React friendly**: Provider + hooks opcionales
- 🔌 **Plug and play**: Setup en minutos
- 🛠️ **Totalmente customizable**: Interceptores, retry, auth helpers, etc.

**No reinventar la rueda:**
- Cache → Dejarlo a TanStack Query/SWR (ellos lo hacen mejor)
- Mutations → TanStack Query/SWR
- Optimistic updates → TanStack Query/SWR

**Enfocarse en:**
- Hacer fetch más agradable de usar
- Proporcionar abstracciones útiles (auth, retry, interceptores)
- TypeScript excepcional
- DX increíble

Implementa en orden: MVP → Core Features → Polish. Si algo toma demasiado tiempo o añade complejidad innecesaria, márcalo como "v2" y continúa.