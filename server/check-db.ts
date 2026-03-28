import mongoose from 'mongoose';
import { env } from './src/config/env.ts';
import { FlowRunModel } from './src/models/flowRun.ts';

const checkDatabase = async (): Promise<void> => {
  console.log('\n--- MongoDB Connection Check ---\n');

  if (!env.mongoUri) {
    console.error('MONGODB_URI is NOT set in .env');
    process.exit(1);
  }
  console.log('MONGODB_URI is set');

  try {
    await mongoose.connect(env.mongoUri);
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Connection failed';
    console.error('Connection failed:', message);
    process.exit(1);
  }

  const db = mongoose.connection.db;

  if (!db) {
    console.error('MongoDB connection is not available.');
    process.exit(1);
  }

  const collections = await db.listCollections().toArray();
  console.log(`Database: "${db.databaseName}" - ${collections.length} collection(s)`);

  const testDoc = await FlowRunModel.create({
    prompt: '__db_check_test__',
    response: `Test document created at ${new Date().toISOString()}`,
  });
  console.log(`Write OK: ${String(testDoc._id)}`);

  await FlowRunModel.findByIdAndDelete(testDoc._id);
  console.log('Delete OK');

  await mongoose.disconnect();
  console.log('\n--- All checks passed ---\n');
};

checkDatabase().catch((error) => {
  const message = error instanceof Error ? error.message : 'Unexpected error';
  console.error(message);
  process.exit(1);
});
