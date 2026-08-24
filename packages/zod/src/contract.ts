import type { ApiClient, HttpMethod, RequestOptions } from "@api-zero/core";
import type { ZodTypeAny, z } from "zod";
import { zodContract } from "./adapters";

export interface ContractDefinition<
  TResponseSchema extends ZodTypeAny,
  TBodySchema extends ZodTypeAny | undefined = undefined,
  TParamsSchema extends ZodTypeAny | undefined = undefined,
> {
  method: HttpMethod;
  path:
    | string
    | ((
        params?: TParamsSchema extends ZodTypeAny
          ? z.infer<TParamsSchema>
          : any,
      ) => string);
  response: TResponseSchema;
  body?: TBodySchema;
  params?: TParamsSchema;
}

export interface ContractExecutionInput<
  TBodySchema extends ZodTypeAny | undefined,
  TParamsSchema extends ZodTypeAny | undefined,
> {
  body?: TBodySchema extends ZodTypeAny ? z.infer<TBodySchema> : undefined;
  params?: TParamsSchema extends ZodTypeAny
    ? z.infer<TParamsSchema>
    : undefined;
  options?: RequestOptions<any, any, any>;
}

export class ApiContract<
  TResponseSchema extends ZodTypeAny,
  TBodySchema extends ZodTypeAny | undefined = undefined,
  TParamsSchema extends ZodTypeAny | undefined = undefined,
> {
  constructor(
    public readonly definition: ContractDefinition<
      TResponseSchema,
      TBodySchema,
      TParamsSchema
    >,
  ) {}

  async fetch(
    client: ApiClient,
    input?: ContractExecutionInput<TBodySchema, TParamsSchema>,
  ): Promise<z.infer<TResponseSchema>> {
    const endpoint =
      typeof this.definition.path === "function"
        ? this.definition.path(input?.params as any)
        : this.definition.path;

    const contractOptions = zodContract({
      response: this.definition.response,
      body: this.definition.body,
      params: this.definition.params,
    });

    return client.request<z.infer<TResponseSchema>, any, any>(
      endpoint,
      this.definition.method,
      input?.body,
      {
        ...input?.options,
        params: input?.params,
        ...contractOptions,
      },
    );
  }
}

/**
 * Defines a type-safe API contract with input and output Zod schemas.
 */
export function defineContract<
  TResponseSchema extends ZodTypeAny,
  TBodySchema extends ZodTypeAny | undefined = undefined,
  TParamsSchema extends ZodTypeAny | undefined = undefined,
>(
  definition: ContractDefinition<TResponseSchema, TBodySchema, TParamsSchema>,
): ApiContract<TResponseSchema, TBodySchema, TParamsSchema> {
  return new ApiContract(definition);
}
