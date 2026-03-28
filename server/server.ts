import cors from "cors";
import express, { type Request, type Response } from "express";
import {
  connectMongo,
  getFlowRunsCollection,
  isMongoConnected,
  settings,
} from "./db.ts";
import { AiServiceError, generateAiResponse } from "./openrouter.ts";
import type {
  AskAiApiResponse,
  AskAiRequestBody,
  SaveFlowRequestBody,
  SaveFlowResponse,
} from "./types.ts";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post(
  "/api/ask-ai",
  async (
    req: Request<Record<string, never>, AskAiApiResponse, AskAiRequestBody>,
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

app.post(
  "/api/flows/save",
  async (
    req: Request<Record<string, never>, SaveFlowResponse, SaveFlowRequestBody>,
    res: Response,
  ) => {
    try {
      const { prompt, response } = req.body || {};

      if (!prompt || !response) {
        return res
          .status(400)
          .json({ error: "Both prompt and response are required." });
      }

      if (!isMongoConnected()) {
        return res
          .status(500)
          .json({ error: "MongoDB is not connected. Check MONGODB_URI." });
      }

      const createdAt = new Date();
      const collection = getFlowRunsCollection();
      const saved = await collection.insertOne({
        prompt,
        response,
        createdAt,
        updatedAt: createdAt,
      });

      return res.status(201).json({
        id: saved.insertedId.toHexString(),
        createdAt: createdAt.toISOString(),
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save flow.";
      return res.status(500).json({ error: message });
    }
  },
);

export const startServer = async (): Promise<void> => {
  await connectMongo();

  app.listen(settings.port, () => {
    console.log(`Server running on http://localhost:${settings.port}`);
  });
};

if (process.argv[1]?.endsWith("server.ts")) {
  await startServer();
}
