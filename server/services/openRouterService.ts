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
  if (typeof error !== "object" || !error || !("status" in error)) {
    return undefined;
  }

  const value = (error as { status?: unknown }).status;
  return typeof value === "number" ? value : undefined;
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

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

    if (
      status === 402 ||
      /requires more credits|insufficient credits/i.test(message)
    ) {
      throw new Error(
        `${message}. Lower OPENROUTER_MAX_TOKENS or add OpenRouter credits.`,
      );
    }

    throw error;
  }
};
