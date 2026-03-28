import { app } from "../app.ts";
import { connectMongo } from "../config/db.ts";

await connectMongo();

export default app;
