import type { AiErrorCode } from "./types.ts";

export const toNumber = (
  value: string | undefined,
  fallback: number,
): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const getErrorStatus = (error: unknown): number | undefined => {
  if (typeof error !== "object" || !error) {
    return undefined;
  }

  const status = (error as { status?: unknown }).status;
  if (typeof status === "number") {
    return status;
  }

  const statusCode = (error as { statusCode?: unknown }).statusCode;
  if (typeof statusCode === "number") {
    return statusCode;
  }

  return undefined;
};

export const getRetryAfterSeconds = (error: unknown): number | undefined => {
  if (typeof error !== "object" || !error || !("headers" in error)) {
    return undefined;
  }

  const headers = (
    error as { headers?: { get?: (name: string) => string | null } }
  ).headers;
  const retryAfterRaw = headers?.get?.("retry-after") || undefined;

  if (!retryAfterRaw) {
    return undefined;
  }

  const asNumber = Number(retryAfterRaw);
  if (Number.isFinite(asNumber) && asNumber > 0) {
    return Math.floor(asNumber);
  }

  const asDate = Date.parse(retryAfterRaw);
  if (Number.isFinite(asDate)) {
    const seconds = Math.ceil((asDate - Date.now()) / 1000);
    return seconds > 0 ? seconds : undefined;
  }

  return undefined;
};

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
};

export class AiServiceError extends Error {
  public readonly status: number;
  public readonly code: AiErrorCode;
  public readonly userMessage: string;
  public readonly retryAfterSeconds?: number;

  constructor(args: {
    message: string;
    status: number;
    code: AiErrorCode;
    userMessage: string;
    retryAfterSeconds?: number;
  }) {
    super(args.message);
    this.status = args.status;
    this.code = args.code;
    this.userMessage = args.userMessage;
    this.retryAfterSeconds = args.retryAfterSeconds;
  }
}
