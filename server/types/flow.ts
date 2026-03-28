import type { ObjectId } from "mongodb";

export type AskAiRequestBody = {
  prompt?: string;
};

export type SaveFlowRequestBody = {
  prompt?: string;
  response?: string;
};

export type AskAiResponse = {
  answer: string;
};

export type AskAiErrorResponse = {
  error: string;
  code?: "RATE_LIMIT" | "CREDIT_LIMIT" | "UPSTREAM_UNAVAILABLE";
  userMessage?: string;
  retryAfterSeconds?: number;
};

export type SaveFlowResponse = {
  id: string;
  createdAt: string;
};

export type FlowRunDocument = {
  _id?: ObjectId;
  prompt: string;
  response: string;
  createdAt: Date;
  updatedAt: Date;
};
