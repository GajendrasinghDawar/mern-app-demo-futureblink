import { MongoClient } from "mongodb";
import { settings } from "./db.ts";

const runGetStarted = async (): Promise<void> => {
  if (!settings.mongoUri) {
    throw new Error("MONGODB_URI is not set in server/.env");
  }

  const client = new MongoClient(settings.mongoUri);

  try {
    const database = client.db("sample_mflix");
    const movies = database.collection("movies");

    const query = { title: "Back to the Future" };
    const movie = await movies.findOne(query);

    if (!movie) {
      console.log(
        "No movie matched 'Back to the Future'. Ensure sample_mflix data exists in Atlas.",
      );
      return;
    }

    console.log(movie);
  } finally {
    await client.close();
  }
};

runGetStarted().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
