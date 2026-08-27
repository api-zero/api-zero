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
  /** The Zod issues, each with the path that failed and why. */
  public readonly issues: ZodIssue[];
  /** The full Zod error, for anything `issues` does not cover. */
  public readonly zodError: ZodError;
  /**
   * Which side failed. `body` means the request never left the process;
   * `response` means the server sent something the contract does not describe.
   */
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
   * Zod's flattened shape: `{ formErrors, fieldErrors }`. Exactly what a form
   * wants for field-level messages.
   */
  flatten() {
    return this.zodError.flatten();
  }

  /**
   * Zod's nested shape, for forms whose fields are nested objects.
   */
  format() {
    return this.zodError.format();
  }
}
