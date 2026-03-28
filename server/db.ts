import dotenv from "dotenv";
import { MongoClient, type Collection, type Db } from "mongodb";
import { toNumber } from "./utils.ts";
import type { FlowRunDocument } from "./types.ts";

dotenv.config();

export const settings = {
  port: toNumber(process.env.PORT, 5000),
  mongoUri: process.env.MONGODB_URI,
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
