import { Router, type Request, type Response } from "express";
import { getFlowRunsCollection, isMongoConnected } from "../config/db.ts";
import type { SaveFlowRequestBody, SaveFlowResponse } from "../types/flow.ts";

export const flowRouter = Router();

flowRouter.post(
  "/flows/save",
  async (
    req: Request<
      Record<string, never>,
      SaveFlowResponse | { error: string },
      SaveFlowRequestBody
    >,
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
      const updatedAt = createdAt;
      const collection = getFlowRunsCollection();
      const saved = await collection.insertOne({
        prompt,
        response,
        createdAt,
        updatedAt,
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
