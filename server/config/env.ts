import dotenv from "dotenv";

dotenv.config();

const toNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toSortValue = (
  value: string | undefined,
): "price" | "latency" | "throughput" | undefined => {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (
    normalized === "price" ||
    normalized === "latency" ||
    normalized === "throughput"
  ) {
    return normalized;
  }

  return undefined;
};

const toModelList = (value: string | undefined): string[] => {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean);
};

export const env = {
  port: toNumber(process.env.PORT, 5000),
  mongoUri: process.env.MONGODB_URI,
  openrouterApiKey: process.env.OPENROUTER_API_KEY,
  openrouterModel:
    process.env.OPENROUTER_MODEL || "google/gemini-3.1-flash-lite-preview",
  openrouterFallbackModels: toModelList(process.env.OPENROUTER_FALLBACK_MODELS),
  openrouterMaxTokens: toNumber(process.env.OPENROUTER_MAX_TOKENS, 256),
  openrouterProviderSort: toSortValue(process.env.OPENROUTER_PROVIDER_SORT),
  siteUrl: process.env.SITE_URL || "http://localhost:5173",
  siteName: process.env.SITE_NAME || "MERN Flow Demo",
} as const;
