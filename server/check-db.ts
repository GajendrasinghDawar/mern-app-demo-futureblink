import {
  closeMongo,
  connectMongo,
  getFlowRunsCollection,
  settings,
} from "./db.ts";

const checkDatabase = async (): Promise<void> => {
  console.log("\n--- MongoDB Connection Check ---\n");

  if (!settings.mongoUri) {
    console.error("MONGODB_URI is NOT set in .env");
    process.exit(1);
  }
  console.log("MONGODB_URI is set");

  try {
    await connectMongo();
    console.log("Connected to MongoDB successfully");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Connection failed";
    console.error("Connection failed:", message);
    process.exit(1);
  }

  const collection = getFlowRunsCollection();
  const db = collection.db;

  const collections = await db.listCollections().toArray();
  console.log(
    `Database: "${db.databaseName}" - ${collections.length} collection(s)`,
  );

  const testDoc = await collection.insertOne({
    prompt: "__db_check_test__",
    response: `Test document created at ${new Date().toISOString()}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log(`Write OK: ${testDoc.insertedId.toHexString()}`);

  await collection.deleteOne({ _id: testDoc.insertedId });
  console.log("Delete OK");

  await closeMongo();
  console.log("\n--- All checks passed ---\n");
};

checkDatabase().catch((error) => {
  const message = error instanceof Error ? error.message : "Unexpected error";
  console.error(message);
  process.exit(1);
});
