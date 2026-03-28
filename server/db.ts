import dotenv from "dotenv";
import { MongoClient, type Collection, type Db } from "mongodb";
import type { FlowRunDocument } from "./types.ts";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const FLOW_RUNS_COLLECTION = "flow_runs";

let mongoConnectionPromise: Promise<void> | null = null;
let mongoClient: MongoClient | null = null;
let database: Db | null = null;

export const connectMongo = async (): Promise<void> => {
  if (!MONGODB_URI) {
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

  mongoConnectionPromise = new MongoClient(MONGODB_URI, {
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
