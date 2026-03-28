export type InputNodeData = {
  prompt: string;
  onChange: (value: string) => void;
};

export type ResultNodeData = {
  result: string;
};

export type AskAiResponse = {
  answer?: string;
  error?: string;
  code?: "RATE_LIMIT" | "CREDIT_LIMIT" | "UPSTREAM_UNAVAILABLE";
  userMessage?: string;
  retryAfterSeconds?: number;
};

export type SaveFlowResponse = {
  id?: string;
  error?: string;
};
