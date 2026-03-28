import { Router, type Request, type Response } from "express";
import {
  AiServiceError,
  generateAiResponse,
} from "../services/openRouterService.ts";
import type {
  AskAiErrorResponse,
  AskAiRequestBody,
  AskAiResponse,
} from "../types/flow.ts";

export const aiRouter = Router();

aiRouter.post(
  "/ask-ai",
  async (
    req: Request<
      Record<string, never>,
      AskAiResponse | AskAiErrorResponse,
      AskAiRequestBody
    >,
    res: Response,
  ) => {
    try {
      const prompt = req.body?.prompt;

      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ error: "Prompt is required." });
      }

      const answer = await generateAiResponse(prompt);
      return res.json({ answer });
    } catch (error) {
      if (error instanceof AiServiceError) {
        return res.status(error.status).json({
          error: error.message,
          code: error.code,
          userMessage: error.userMessage,
          retryAfterSeconds: error.retryAfterSeconds,
        });
      }

      const message =
        error instanceof Error ? error.message : "Failed to get AI response.";
      return res.status(500).json({ error: message });
    }
  },
);
