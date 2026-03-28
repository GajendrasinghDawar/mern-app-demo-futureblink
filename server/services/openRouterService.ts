import OpenAI from "openai";
import { env } from "../config/env.ts";

const fallbackModels = [
  env.openrouterModel,
  "google/gemini-2.5-flash-lite",
  "meta-llama/llama-3.2-3b-instruct:free",
].filter((value, index, array) => array.indexOf(value) === index);

const getClient = (): OpenAI =>
  new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: env.openrouterApiKey,
  });

export const generateAiResponse = async (prompt: string): Promise<string> => {
  if (!env.openrouterApiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured.");
  }

  const client = getClient();
  let completion: Awaited<
    ReturnType<typeof client.chat.completions.create>
  > | null = null;
  let lastError: unknown = null;

  for (const selectedModel of fallbackModels) {
    try {
      completion = await client.chat.completions.create(
        {
          model: selectedModel,
          messages: [{ role: "user", content: prompt }],
        },
        {
          headers: {
            "HTTP-Referer": env.siteUrl,
            "X-Title": env.siteName,
          },
        },
      );
      break;
    } catch (error) {
      lastError = error;
      const message =
        typeof error === "object" && error !== null && "message" in error
          ? String(error.message)
          : "";
      const isMissingEndpoint = /no endpoints found/i.test(message);

      if (!isMissingEndpoint) {
        throw error;
      }
    }
  }

  if (!completion) {
    const message =
      typeof lastError === "object" &&
      lastError !== null &&
      "message" in lastError
        ? String(lastError.message)
        : "No OpenRouter endpoints available for configured model.";
    throw new Error(message);
  }

  const answer = completion.choices?.[0]?.message?.content?.trim();

  if (!answer) {
    throw new Error("OpenRouter returned an empty response.");
  }

  return answer;
};
