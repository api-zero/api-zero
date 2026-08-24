import { ApiError } from "@api-zero/core";
import type { ZodError, ZodIssue } from "zod";

export type ValidationTarget = "response" | "body" | "params";

export interface ZodValidationErrorOptions<TData = unknown> {
  status?: number;
  statusText?: string;
  data?: TData;
  request?: any;
  response?: Response;
  cause?: Error;
  attempt?: number;
}

export class ZodValidationError<TData = unknown> extends ApiError<TData> {
  override readonly name = "ZodValidationError";
  public readonly issues: ZodIssue[];
  public readonly zodError: ZodError;
  public readonly target: ValidationTarget;

  constructor(
    zodError: ZodError,
    target: ValidationTarget,
    options: ZodValidationErrorOptions<TData> = {},
  ) {
    const formattedSummary = zodError.issues
      .map((i) => `[${i.path.join(".") || "root"}]: ${i.message}`)
      .join(", ");
    const message = `Zod validation failed for ${target}: ${formattedSummary}`;

    super(
      message,
      options.status ?? 0,
      options.statusText ?? "Validation Error",
      options.data,
      options.request,
      false,
      false,
      false,
      true,
      options.response,
      zodError,
      options.attempt ?? 1,
    );

    this.zodError = zodError;
    this.issues = zodError.issues;
    this.target = target;

    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * Flatten Zod error issues into formErrors and fieldErrors.
   */
  flatten() {
    return this.zodError.flatten();
  }

  /**
   * Format Zod error into a nested error representation.
   */
  format() {
    return this.zodError.format();
  }
}
