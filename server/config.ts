import dotenv from "dotenv";
import { OpenRouter } from "@openrouter/sdk";
import { MongoClient, type Collection, type Db } from "mongodb";
import {
  getErrorMessage,
  getErrorStatus,
  getRetryAfterSeconds,
  toModelList,
  toNumber,
  toProviderSort,
} from "./utils.ts";
import type { AiErrorCode, FlowRunDocument } from "./types.ts";

dotenv.config();

export const settings = {
  port: toNumber(process.env.PORT, 5000),
  mongoUri: process.env.MONGODB_URI,
  openrouterApiKey: process.env.OPENROUTER_API_KEY,
  openrouterModel:
    process.env.OPENROUTER_MODEL || "google/gemini-3.1-flash-lite-preview",
  openrouterFallbackModels: toModelList(process.env.OPENROUTER_FALLBACK_MODELS),
  openrouterMaxTokens: toNumber(process.env.OPENROUTER_MAX_TOKENS, 256),
  openrouterProviderSort: toProviderSort(process.env.OPENROUTER_PROVIDER_SORT),
  siteUrl: process.env.SITE_URL || "http://localhost:5173",
  siteName: process.env.SITE_NAME || "MERN Flow Demo",
} as const;

let mongoConnectionPromise: Promise<void> | null = null;
let mongoClient: MongoClient | null = null;
let database: Db | null = null;

const FLOW_RUNS_COLLECTION = "flow_runs";

export const connectMongo = async (): Promise<void> => {
  const mongoUri = settings.mongoUri;

  if (!mongoUri) {
    console.warn(
      "MONGODB_URI is not set. Save endpoint will fail until it is configured.",
    );
    return;
  }

  if (database) {
    return;
  }

  if (mongoConnectionPromise) {
    return mongoConnectionPromise;
  }

  mongoConnectionPromise = new MongoClient(mongoUri, {
    serverSelectionTimeoutMS: 8000,
  })
    .connect()
    .then((client) => {
      mongoClient = client;
      database = client.db();
    })
    .then(() => {
      console.log("MongoDB connected");
    })
    .catch((error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Unknown MongoDB error";
      console.error("MongoDB connection failed:", message);
      mongoClient = null;
      database = null;
    })
    .finally(() => {
      mongoConnectionPromise = null;
    });

  return mongoConnectionPromise;
};

export const isMongoConnected = (): boolean => Boolean(database);

export const getFlowRunsCollection = (): Collection<FlowRunDocument> => {
  if (!database) {
    throw new Error("MongoDB is not connected. Check MONGODB_URI.");
  }

  return database.collection<FlowRunDocument>(FLOW_RUNS_COLLECTION);
};

export const closeMongo = async (): Promise<void> => {
  if (!mongoClient) {
    return;
  }

  await mongoClient.close();
  mongoClient = null;
  database = null;
};

const fallbackModels = [
  settings.openrouterModel,
  ...settings.openrouterFallbackModels,
  "google/gemini-2.5-flash-lite",
  "meta-llama/llama-3.2-3b-instruct:free",
].filter((value, index, array) => array.indexOf(value) === index);

const getOpenRouterClient = (): OpenRouter => {
  if (!settings.openrouterApiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured.");
  }

  return new OpenRouter({
    apiKey: settings.openrouterApiKey,
    httpReferer: settings.siteUrl,
    appTitle: settings.siteName,
  });
};

export class AiServiceError extends Error {
  public readonly status: number;
  public readonly code: AiErrorCode;
  public readonly userMessage: string;
  public readonly retryAfterSeconds?: number;

  constructor(args: {
    message: string;
    status: number;
    code: AiErrorCode;
    userMessage: string;
    retryAfterSeconds?: number;
  }) {
    super(args.message);
    this.status = args.status;
    this.code = args.code;
    this.userMessage = args.userMessage;
    this.retryAfterSeconds = args.retryAfterSeconds;
  }
}

export const generateAiResponse = async (prompt: string): Promise<string> => {
  const openRouter = getOpenRouterClient();

  try {
    const completion = await openRouter.chat.send({
      chatGenerationParams: {
        models: fallbackModels,
        messages: [{ role: "user", content: prompt }],
        maxTokens: Math.max(1, settings.openrouterMaxTokens),
        provider: settings.openrouterProviderSort
          ? { sort: settings.openrouterProviderSort }
          : undefined,
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
};
