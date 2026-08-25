import type { RequestOptions } from "@api-zero/core";
import type { ZodTypeAny, z } from "zod";
import { ZodValidationError } from "./error";

export interface ZodResponseOptions<TSchema extends ZodTypeAny> {
  transformResponse: (data: unknown) => Promise<z.infer<TSchema>>;
}

export interface ZodBodyOptions<TSchema extends ZodTypeAny> {
  transformRequest: (body: unknown) => Promise<z.infer<TSchema>>;
}

/**
 * Validates and transforms response data with a Zod schema.
 * Automatically infers the return type as `z.infer<typeof schema>`.
 */
export function zodResponse<TSchema extends ZodTypeAny>(
  schema: TSchema,
): ZodResponseOptions<TSchema> {
  return {
    transformResponse: async (data: unknown) => {
      const result = await schema.safeParseAsync(data);
      if (!result.success) {
        throw new ZodValidationError(result.error, "response", { data });
      }
      return result.data;
    },
  };
}

/**
 * Validates the request body with a Zod schema before sending.
 * Throws ZodValidationError before network dispatch if the body is invalid.
 */
export function zodBody<TSchema extends ZodTypeAny>(
  schema: TSchema,
): ZodBodyOptions<TSchema> {
  return {
    transformRequest: async (body: unknown) => {
      const result = await schema.safeParseAsync(body);
      if (!result.success) {
        throw new ZodValidationError(result.error, "body", { data: body });
      }
      return result.data;
    },
  };
}

export interface ZodContractOptions<
  TResponseSchema extends ZodTypeAny | undefined = undefined,
  TBodySchema extends ZodTypeAny | undefined = undefined,
> {
  response?: TResponseSchema;
  body?: TBodySchema;
}

/**
 * Combines response and body Zod schemas into a single RequestOptions object.
 *
 * Query parameters are deliberately absent: the core request pipeline has no
 * params-validation hook, so accepting a params schema here would type the
 * result as validated while validating nothing.
 */
export function zodContract<
  TResponseSchema extends ZodTypeAny | undefined = undefined,
  TBodySchema extends ZodTypeAny | undefined = undefined,
>(
  options: ZodContractOptions<TResponseSchema, TBodySchema>,
): RequestOptions<
  TResponseSchema extends ZodTypeAny ? z.infer<TResponseSchema> : unknown,
  TBodySchema extends ZodTypeAny ? z.infer<TBodySchema> : unknown
> {
  const resultOptions: RequestOptions<any, any, any> = {};

  if (options.body) {
    resultOptions.transformRequest = zodBody(options.body).transformRequest;
  }

  if (options.response) {
    resultOptions.transformResponse = zodResponse(
      options.response,
    ).transformResponse;
  }

  return resultOptions as RequestOptions<
    TResponseSchema extends ZodTypeAny ? z.infer<TResponseSchema> : unknown,
    TBodySchema extends ZodTypeAny ? z.infer<TBodySchema> : unknown
  >;
}
