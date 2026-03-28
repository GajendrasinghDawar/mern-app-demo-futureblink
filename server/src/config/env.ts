import dotenv from 'dotenv';

dotenv.config();

const toNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  port: toNumber(process.env.PORT, 5000),
  mongoUri: process.env.MONGODB_URI,
  openrouterApiKey: process.env.OPENROUTER_API_KEY,
  openrouterModel: process.env.OPENROUTER_MODEL || 'google/gemini-3.1-flash-lite-preview',
  siteUrl: process.env.SITE_URL || 'http://localhost:5173',
  siteName: process.env.SITE_NAME || 'MERN Flow Demo',
} as const;
