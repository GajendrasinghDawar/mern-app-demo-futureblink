import type { ProviderSort } from "./types.ts";

export const toNumber = (
  value: string | undefined,
  fallback: number,
): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const toProviderSort = (
  value: string | undefined,
): ProviderSort | undefined => {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (
    normalized === "price" ||
    normalized === "latency" ||
    normalized === "throughput"
  ) {
    return normalized;
  }

  return undefined;
};

export const toModelList = (value: string | undefined): string[] => {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean);
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
