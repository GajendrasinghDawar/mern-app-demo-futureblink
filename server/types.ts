import type { ObjectId } from "mongodb";

export type ProviderSort = "price" | "latency" | "throughput";

export type AiErrorCode =
  | "RATE_LIMIT"
  | "CREDIT_LIMIT"
  | "UPSTREAM_UNAVAILABLE";

export type AskAiRequestBody = {
  prompt?: string;
};

export type AskAiSuccessResponse = {
  answer: string;
};

export type AskAiErrorResponse = {
  error: string;
  code?: AiErrorCode;
  userMessage?: string;
  retryAfterSeconds?: number;
};

export type AskAiApiResponse = AskAiSuccessResponse | AskAiErrorResponse;

export type SaveFlowRequestBody = {
  prompt?: string;
  response?: string;
};

export type SaveFlowResponse = {
  id?: string;
  createdAt?: string;
  error?: string;
};

export type FlowRunDocument = {
  _id?: ObjectId;
  prompt: string;
  response: string;
  createdAt: Date;
  updatedAt: Date;
};
