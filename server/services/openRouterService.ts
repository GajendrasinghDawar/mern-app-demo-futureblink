import { OpenRouter } from "@openrouter/sdk";
import { env } from "../config/env.ts";

const fallbackModels = [
  env.openrouterModel,
  ...env.openrouterFallbackModels,
  "google/gemini-2.5-flash-lite",
  "meta-llama/llama-3.2-3b-instruct:free",
].filter((value, index, array) => array.indexOf(value) === index);

const getClient = (): OpenRouter => {
  if (!env.openrouterApiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured.");
  }

  return new OpenRouter({
    apiKey: env.openrouterApiKey,
    httpReferer: env.siteUrl,
    appTitle: env.siteName,
  });
};

const getErrorStatus = (error: unknown): number | undefined => {
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

const getRetryAfterSeconds = (error: unknown): number | undefined => {
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

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

export class AiServiceError extends Error {
  public readonly status: number;
  public readonly code: "RATE_LIMIT" | "CREDIT_LIMIT" | "UPSTREAM_UNAVAILABLE";
  public readonly userMessage: string;
  public readonly retryAfterSeconds?: number;

  constructor(args: {
    message: string;
    status: number;
    code: "RATE_LIMIT" | "CREDIT_LIMIT" | "UPSTREAM_UNAVAILABLE";
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

export const generateAiResponse = async (prompt: string): Promise<string> => {
  const openRouter = getClient();

  try {
    const completion = await openRouter.chat.send({
      chatGenerationParams: {
        models: fallbackModels,
        messages: [{ role: "user", content: prompt }],
        maxTokens: Math.max(1, env.openrouterMaxTokens),
        provider: env.openrouterProviderSort
          ? { sort: env.openrouterProviderSort }
          : undefined,
        stream: false,
      },
    });

    const answer = completion.choices?.[0]?.message?.content?.trim();
    if (!answer) {
      throw new Error("OpenRouter returned an empty response.");
    }

    return answer;
  } catch (error) {
    const status = getErrorStatus(error);
    const message = getErrorMessage(error);
    const retryAfterSeconds = getRetryAfterSeconds(error);

    if (status === 429 || /rate limit|too many requests/i.test(message)) {
      throw new AiServiceError({
        message,
        status: 429,
        code: "RATE_LIMIT",
        userMessage: retryAfterSeconds
          ? `Rate limit reached. Please wait ${retryAfterSeconds}s and try again.`
          : "Rate limit reached. Please wait a moment and try again.",
        retryAfterSeconds,
      });
    }

    if (
      status === 402 ||
      /requires more credits|insufficient credits/i.test(message)
    ) {
      throw new AiServiceError({
        message,
        status: 402,
        code: "CREDIT_LIMIT",
        userMessage:
          "OpenRouter credits are low or exhausted. Please add credits or try again later.",
      });
    }

    if (status && status >= 500) {
      throw new AiServiceError({
        message,
        status: 503,
        code: "UPSTREAM_UNAVAILABLE",
        userMessage:
          "AI provider is temporarily unavailable. Please try again in a bit.",
      });
    }

    throw error;
  }
};
