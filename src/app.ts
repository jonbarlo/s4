import 'dotenv/config';
import express from 'express';
import db from '../models';
import authRouter from './api/auth';
import bucketsRouter from './api/buckets';
import foldersRouter from './api/folders';
import filesRouter from './api/files';
// import other routers as needed

const app = express();
app.use(express.json());

console.log('DEBUG ENV', {
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD ? '********' : process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,
  DB_PORT: process.env.DB_PORT,
  NODE_ENV: process.env.NODE_ENV
});

// Health check endpoint
app.get('/health', async (req, res) => {
  const envLoaded = !!process.env.DB_HOST && !!process.env.DB_USER && !!process.env.DB_PASSWORD && !!process.env.DB_NAME && !!process.env.DB_PORT;
  let dbOk = false;
  let dbError = null;
  try {
    await db.sequelize.authenticate();
    dbOk = true;
  } catch (e) {
    dbOk = false;
    dbError = e instanceof Error ? e.message : String(e);
    console.error('DB Connection Error:', dbError);
  }
  res.json({
    status: envLoaded && dbOk ? 'ok' : 'error',
    envLoaded,
    dbOk,
    dbHost: process.env.DB_HOST,
    dbUser: process.env.DB_USER,
    environment: process.env.NODE_ENV || 'development',
    dbError
  });
});

// Mount API routes
app.use('/auth', authRouter);
app.use('/buckets', bucketsRouter);
app.use('/folders', foldersRouter);
app.use('/files', filesRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});

export default app;
