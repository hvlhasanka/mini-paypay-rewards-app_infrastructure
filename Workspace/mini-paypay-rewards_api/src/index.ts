import express from 'express';
import cors from 'cors';
import { env } from './lib/env.js';
import authRouter from './routes/auth.js';
import rewardsRouter from './routes/rewards.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/auth', authRouter);
app.use('/rewards', rewardsRouter);

app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${env.port}`);
});
