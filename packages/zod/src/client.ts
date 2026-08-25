import {
  ApiClient,
  type ApiClientConfig,
  type RequestOptions,
} from "@api-zero/core";
import type { ZodTypeAny, z } from "zod";
import { zodContract, zodResponse } from "./adapters";

export interface ZodMethodSchemas<
  TResponseSchema extends ZodTypeAny,
  TBodySchema extends ZodTypeAny = ZodTypeAny,
> {
  response: TResponseSchema;
  body?: TBodySchema;
}

function mergeTransforms<T>(
  existing?: T | T[],
  additional?: T | T[],
): T[] | undefined {
  if (!existing && !additional) return undefined;
  const list: T[] = [];
  if (existing) {
    if (Array.isArray(existing)) list.push(...existing);
    else list.push(existing);
  }
  if (additional) {
    if (Array.isArray(additional)) list.push(...additional);
    else list.push(additional);
  }
  return list;
}

/**
 * Adds schema-aware verbs on top of an ApiClient.
 *
 * It deliberately does NOT mirror the client's configuration API (auth,
 * headers, interceptors). Every mirrored method is one more thing to keep in
 * sync with core, and it silently falls behind the moment core grows a method.
 * Reach the underlying client through `.client` instead — it is the same
 * instance, so configuring it configures this.
 */
export class ZodApiClient {
  constructor(public readonly client: ApiClient) {}

  async get<TSchema extends ZodTypeAny, TParams = Record<string, unknown>>(
    endpoint: string,
    schema: TSchema,
    options?: RequestOptions<z.infer<TSchema>, unknown, TParams>,
  ): Promise<z.infer<TSchema>> {
    const zodOpts = zodResponse(schema);
    return this.client.get<z.infer<TSchema>, TParams>(endpoint, {
      ...options,
      transformResponse: mergeTransforms(
        options?.transformResponse,
        zodOpts.transformResponse,
      ) as any,
    });
  }

  async post<
    TResponseSchema extends ZodTypeAny,
    TBodySchema extends ZodTypeAny = ZodTypeAny,
    TParams = Record<string, unknown>,
  >(
    endpoint: string,
    body: z.infer<TBodySchema> | unknown,
    schemas: ZodMethodSchemas<TResponseSchema, TBodySchema> | TResponseSchema,
    options?: RequestOptions<z.infer<TResponseSchema>, any, TParams>,
  ): Promise<z.infer<TResponseSchema>> {
    const responseSchema = "response" in schemas ? schemas.response : schemas;
    const bodySchema = "body" in schemas ? schemas.body : undefined;

    const contractOpts = zodContract({
      response: responseSchema,
      body: bodySchema,
    });

    return this.client.post<z.infer<TResponseSchema>, any, TParams>(
      endpoint,
      body,
      {
        ...options,
        transformRequest: mergeTransforms(
          options?.transformRequest,
          contractOpts.transformRequest,
        ) as any,
        transformResponse: mergeTransforms(
          options?.transformResponse,
          contractOpts.transformResponse,
        ) as any,
      },
    );
  }

  async put<
    TResponseSchema extends ZodTypeAny,
    TBodySchema extends ZodTypeAny = ZodTypeAny,
    TParams = Record<string, unknown>,
  >(
    endpoint: string,
    body: z.infer<TBodySchema> | unknown,
    schemas: ZodMethodSchemas<TResponseSchema, TBodySchema> | TResponseSchema,
    options?: RequestOptions<z.infer<TResponseSchema>, any, TParams>,
  ): Promise<z.infer<TResponseSchema>> {
    const responseSchema = "response" in schemas ? schemas.response : schemas;
    const bodySchema = "body" in schemas ? schemas.body : undefined;

    const contractOpts = zodContract({
      response: responseSchema,
      body: bodySchema,
    });

    return this.client.put<z.infer<TResponseSchema>, any, TParams>(
      endpoint,
      body,
      {
        ...options,
        transformRequest: mergeTransforms(
          options?.transformRequest,
          contractOpts.transformRequest,
        ) as any,
        transformResponse: mergeTransforms(
          options?.transformResponse,
          contractOpts.transformResponse,
        ) as any,
      },
    );
  }

  async patch<
    TResponseSchema extends ZodTypeAny,
    TBodySchema extends ZodTypeAny = ZodTypeAny,
    TParams = Record<string, unknown>,
  >(
    endpoint: string,
    body: z.infer<TBodySchema> | unknown,
    schemas: ZodMethodSchemas<TResponseSchema, TBodySchema> | TResponseSchema,
    options?: RequestOptions<z.infer<TResponseSchema>, any, TParams>,
  ): Promise<z.infer<TResponseSchema>> {
    const responseSchema = "response" in schemas ? schemas.response : schemas;
    const bodySchema = "body" in schemas ? schemas.body : undefined;

    const contractOpts = zodContract({
      response: responseSchema,
      body: bodySchema,
    });

    return this.client.patch<z.infer<TResponseSchema>, any, TParams>(
      endpoint,
      body,
      {
        ...options,
        transformRequest: mergeTransforms(
          options?.transformRequest,
          contractOpts.transformRequest,
        ) as any,
        transformResponse: mergeTransforms(
          options?.transformResponse,
          contractOpts.transformResponse,
        ) as any,
      },
    );
  }

  async delete<TSchema extends ZodTypeAny, TParams = Record<string, unknown>>(
    endpoint: string,
    schema: TSchema,
    options?: RequestOptions<z.infer<TSchema>, unknown, TParams>,
  ): Promise<z.infer<TSchema>> {
    const zodOpts = zodResponse(schema);
    return this.client.delete<z.infer<TSchema>, TParams>(endpoint, {
      ...options,
      transformResponse: mergeTransforms(
        options?.transformResponse,
        zodOpts.transformResponse,
      ) as any,
    });
  }
}

/**
 * Wraps an ApiClient with typed Zod methods (get, post, put, patch, delete).
 */
export function withZod(client: ApiClient): ZodApiClient {
  return new ZodApiClient(client);
}

/**
 * Creates a new ZodApiClient with optional initial config.
 */
export function createZodClient(config?: ApiClientConfig): ZodApiClient {
  return new ZodApiClient(new ApiClient(config));
}
