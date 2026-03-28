import { connectMongo } from "../db.ts";
import { app } from "../server.ts";

await connectMongo();

export default app;
