import type { AskAiResponse, SaveFlowResponse } from "./flowTypes";

const getFriendlyAskAiError = (
  data: AskAiResponse,
  statusCode: number,
): string => {
  if (data.userMessage) {
    return data.userMessage;
  }

  if (data.code === "RATE_LIMIT") {
    return data.retryAfterSeconds
      ? `Rate limit reached. Please wait ${data.retryAfterSeconds}s and try again.`
      : "Rate limit reached. Please wait a moment and try again.";
  }

  if (data.code === "CREDIT_LIMIT") {
    return "OpenRouter credits are low or exhausted. Please try again later.";
  }

  if (data.code === "UPSTREAM_UNAVAILABLE" || statusCode >= 500) {
    return "AI service is temporarily unavailable. Please try again shortly.";
  }

  return data.error || "Failed to run flow.";
};

export const requestAiResponse = async (
  apiBaseUrl: string,
  prompt: string,
): Promise<string> => {
  const response = await fetch(`${apiBaseUrl}/api/ask-ai`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  const data = (await response.json()) as AskAiResponse;

  if (!response.ok || !data.answer) {
    throw new Error(getFriendlyAskAiError(data, response.status));
  }

  return data.answer;
};

export const saveFlowRun = async (
  apiBaseUrl: string,
  prompt: string,
  responseText: string,
): Promise<string> => {
  const response = await fetch(`${apiBaseUrl}/api/flows/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, response: responseText }),
  });

  const data = (await response.json()) as SaveFlowResponse;

  if (!response.ok || !data.id) {
    throw new Error(data.error || "Save failed.");
  }

  return data.id;
};
