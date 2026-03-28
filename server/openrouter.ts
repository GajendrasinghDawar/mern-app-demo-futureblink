import dotenv from "dotenv";
import { OpenRouter } from "@openrouter/sdk";
import {
  AiServiceError,
  getErrorMessage,
  getErrorStatus,
  getRetryAfterSeconds,
} from "./utils.ts";

dotenv.config();

const OPENROUTER_MODEL = "google/gemini-3.1-flash-lite-preview";
const OPENROUTER_MAX_TOKENS = 256;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export async function generateAiResponse(prompt: string): Promise<string> {
  try {
    if (!OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY is not configured.");
    }

    const openRouter = new OpenRouter({
      apiKey: OPENROUTER_API_KEY,
    });

    const completion = await openRouter.chat.send({
      chatGenerationParams: {
        model: OPENROUTER_MODEL,
        messages: [{ role: "user", content: prompt }],
        maxTokens: Math.max(1, OPENROUTER_MAX_TOKENS),
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
}
