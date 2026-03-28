import { Router, type Request, type Response } from "express";
import { generateAiResponse } from "../services/openRouterService.ts";
import type { AskAiRequestBody, AskAiResponse } from "../types/flow.ts";

export const aiRouter = Router();

aiRouter.post(
  "/ask-ai",
  async (
    req: Request<
      Record<string, never>,
      AskAiResponse | { error: string },
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
      const message =
        error instanceof Error ? error.message : "Failed to get AI response.";
      return res.status(500).json({ error: message });
    }
  },
);
