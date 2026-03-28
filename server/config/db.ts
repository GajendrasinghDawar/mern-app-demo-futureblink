import {
  MongoClient,
  type Collection,
  type Db,
  type MongoClientOptions,
} from "mongodb";
import { env } from "./env.ts";
import type { FlowRunDocument } from "../types/flow.ts";

let mongoConnectionPromise: Promise<void> | null = null;
let mongoClient: MongoClient | null = null;
let database: Db | null = null;

const FLOW_RUNS_COLLECTION = "flow_runs";

const getDatabaseName = (mongoUri: string): string => {
  try {
    const pathname = new URL(mongoUri).pathname.replace(/^\/+/, "");
    return pathname || "test";
  } catch {
    return "test";
  }
};

export const connectMongo = async (): Promise<void> => {
  const mongoUri = env.mongoUri;

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

  const options: MongoClientOptions = {
    serverSelectionTimeoutMS: 8000,
  };

  mongoConnectionPromise = new MongoClient(mongoUri, options)
    .connect()
    .then((client) => {
      mongoClient = client;
      database = client.db(getDatabaseName(mongoUri));
      return;
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

export const getDatabase = (): Db => {
  if (!database) {
    throw new Error("MongoDB is not connected. Check MONGODB_URI.");
  }

  return database;
};

export const getFlowRunsCollection = (): Collection<FlowRunDocument> => {
  return getDatabase().collection<FlowRunDocument>(FLOW_RUNS_COLLECTION);
};

export const closeMongo = async (): Promise<void> => {
  if (!mongoClient) {
    return;
  }

  await mongoClient.close();
  mongoClient = null;
  database = null;
};
