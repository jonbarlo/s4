import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { Sequelize } from 'sequelize';
import bucketsRouter from './api/buckets';
import filesRouter from './api/files';
import foldersRouter from './api/folders';
import cors from 'cors';
import authRouter from './api/auth';

let envPath: string;
if (process.env.NODE_ENV === 'production') {
  envPath = path.resolve(__dirname, '../../.env');
} else {
  envPath = path.resolve(__dirname, '../.env');
}
dotenv.config({ path: envPath });
console.log('[DEBUG] Loaded .env from:', envPath);
console.log('[DEBUG] __dirname:', __dirname);
console.log('[DEBUG] ENV_PATH:', envPath);
console.log('[DEBUG] envExists:', fs.existsSync(envPath));

const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

console.log('[DEBUG] Loaded environment variables:', {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_NAME: process.env.DB_NAME
});

// Setup Sequelize connection (no queries yet)
let sequelize: Sequelize | null = null;
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
    console.log('[DEBUG] Sequelize instance created.');
  } catch (err) {
    console.error('[DEBUG] Sequelize connection error:', err);
  }
}

const app = express();
const PORT = process.env.PORT || 3000;

console.log('[DEBUG] Starting main app (minimal baseline)...');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use((req, res, next) => {
  console.log(`[DEBUG] Incoming request: ${req.method} ${req.url}`);
  next();
});

app.get('/', (req, res) => {
  const envExists = fs.existsSync(envPath);
  if (missingEnvVars.length > 0) {
    return res.status(500).json({
      status: 'error',
      message: 'Missing required DB environment variables',
      missingEnvVars,
      debug: {
        ENV_PATH: envPath,
        envExists,
        CWD: process.cwd(),
        __dirname: __dirname,
        JWT_SECRET: process.env.JWT_SECRET || null
      }
    });
  }
  res.json({
    status: 'ok',
    message: 'Main app (minimal baseline) is working',
    dbHost: process.env.DB_HOST || null,
    env: {
      NODE_ENV: process.env.NODE_ENV,
      DB_HOST: process.env.DB_HOST,
      JWT_SECRET: process.env.JWT_SECRET || null
    },
    debug: {
      ENV_PATH: envPath,
      envExists,
      CWD: process.cwd(),
      __dirname: __dirname,
      JWT_SECRET: process.env.JWT_SECRET || null
    }
  });
});

app.get('/health', async (req, res) => {
  console.log('[DEBUG] Health endpoint hit');
  if (!sequelize) {
    return res.status(500).json({ status: 'error', message: 'Sequelize not initialized' });
  }
  try {
    const [results] = await sequelize.query('SELECT 1+1 AS result');
    res.json({ status: 'ok', message: 'Main app health is working', dbTest: results });
  } catch (err: any) {
    console.error('[DEBUG] DB health check error:', err);
    res.status(500).json({ status: 'error', message: 'DB health check failed', error: err.message });
  }
});

app.get('/users', async (req, res) => {
  if (!sequelize) {
    return res.status(500).json({ status: 'error', message: 'Sequelize not initialized' });
  }
  try {
    const [results] = await sequelize.query('SELECT * FROM [scams3_root].[Users]');
    console.log('[DEBUG] /users query result:', results);
    res.json({ status: 'ok', users: results });
  } catch (err: any) {
    console.error('[DEBUG] /users query error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch users', error: err.message });
  }
});

app.use('/auth', authRouter);
app.use('/buckets', bucketsRouter);
app.use('/files', filesRouter);
app.use('/folders', foldersRouter);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[DEBUG] Error handler:', err);
  res.status(500).json({ status: 'error', error: err.message || 'Unknown error' });
});

app.listen(PORT, () => {
  console.log(`[DEBUG] Main app (minimal baseline) server running on port ${PORT}`);
});
