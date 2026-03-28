import { app } from './app.ts';
import { connectMongo } from './config/db.ts';
import { env } from './config/env.ts';

await connectMongo();

app.listen(env.port, () => {
  console.log(`Server running on http://localhost:${env.port}`);
});
