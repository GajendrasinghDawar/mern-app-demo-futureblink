import { connectMongo } from "../config.ts";
import { app } from "../server.ts";

await connectMongo();

export default app;
