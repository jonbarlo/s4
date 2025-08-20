import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { Sequelize } from 'sequelize';
import initializeModels from './models';
import createAuthRouter from './api/auth';
import { createJwtAuthMiddleware } from './middlewares/auth';
import createBucketsRouter from './api/buckets';
import createFilesRouter from './api/files';
import createFoldersRouter from './api/folders';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
// import cors from 'cors';

// Dual-path .env loading: try ../.env, then ../../.env
let envPath = path.resolve(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  envPath = path.resolve(__dirname, '../../.env');
}
dotenv.config({ path: envPath });

const app = express();

// Security middleware
app.use(helmet());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
}));

// Setup Sequelize connection and models
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);
let sequelize: Sequelize | null = null;
let db: any = null;
if (missingEnvVars.length === 0) {
  try {
    sequelize = new Sequelize(
      process.env.DB_NAME!,
      process.env.DB_USER!,
      process.env.DB_PASSWORD!,
      {
        host: process.env.DB_HOST!,
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 1433,
        dialect: 'mssql',
        dialectOptions: { options: { encrypt: false }, authentication: { type: 'default' } },
        logging: console.log,
      }
    );
    db = initializeModels(sequelize);
    console.log('[DEBUG] Sequelize instance and models initialized.');
  } catch (err) {
    console.error('[DEBUG] Sequelize connection error:', err);
  }
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => res.send('ok'));

app.get('/env-test', (req, res) => {
  const envExists = fs.existsSync(envPath);
  res.json({
    envPath,
    envExists,
    cwd: process.cwd(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      DB_HOST: process.env.DB_HOST,
      DB_USER: process.env.DB_USER,
      DB_NAME: process.env.DB_NAME,
      PORT: process.env.PORT,
    }
  });
});

app.get('/health', async (req, res) => {
  if (!sequelize) {
    return res.status(500).json({ status: 'error', message: 'Sequelize not initialized' });
  }
  try {
    const [results] = await sequelize.query('SELECT 1+1 AS result');
    res.json({ status: 'ok', message: 'Health check passed', dbTest: results });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: 'DB health check failed', error: err.message });
  }
});

app.get('/users', async (req, res) => {
  if (!sequelize) {
    return res.status(500).json({ status: 'error', message: 'Sequelize not initialized' });
  }
  try {
    const [results] = await sequelize.query('SELECT * FROM [scams3_root].[Users]');
    res.json({ status: 'ok', users: results });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch users', error: err.message });
  }
});

// Restore authentication and all main routers
const jwtAuthMiddleware = createJwtAuthMiddleware(db);
app.use('/auth', createAuthRouter(db));
app.use('/buckets', createBucketsRouter(db, jwtAuthMiddleware));
app.use('/files', createFilesRouter(db, jwtAuthMiddleware));
app.use('/folders', createFoldersRouter(db, jwtAuthMiddleware));

export default app;
