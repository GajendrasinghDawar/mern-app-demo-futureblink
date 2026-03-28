import cors from 'cors';
import express from 'express';
import { aiRouter } from './routes/aiRoutes.ts';
import { flowRouter } from './routes/flowRoutes.ts';

export const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api', aiRouter);
app.use('/api', flowRouter);
