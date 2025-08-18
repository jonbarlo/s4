import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { Sequelize } from 'sequelize';

// Always load .env from the project root (three levels up from dist/src/minimal.js)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
console.log('[DEBUG] Loaded .env from', path.resolve(__dirname, '../../.env'));

// Check for required DB env vars (do not throw, just check)
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

// Debug: Log when server starts
console.log('[DEBUG] Starting minimal API...');

// Debug: Log every request
app.use((req, res, next) => {
  console.log(`[DEBUG] Incoming request: ${req.method} ${req.url}`);
  next();
});

// Root endpoint
app.get('/', (req, res) => {
  const envPath = path.resolve(__dirname, '../../.env');
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
        __dirname: __dirname
      }
    });
  }
  res.json({
    status: 'ok',
    message: 'Minimal API with env and DB connection setup is working',
    dbHost: process.env.DB_HOST || null,
    env: {
      NODE_ENV: process.env.NODE_ENV,
      DB_HOST: process.env.DB_HOST
    },
    debug: {
      ENV_PATH: envPath,
      envExists,
      CWD: process.cwd(),
      __dirname: __dirname
    }
  });
});

// Health endpoint with DB query
app.get('/health', async (req, res) => {
  console.log('[DEBUG] Health endpoint hit');
  if (!sequelize) {
    return res.status(500).json({ status: 'error', message: 'Sequelize not initialized' });
  }
  try {
    const [results] = await sequelize.query('SELECT 1+1 AS result');
    res.json({ status: 'ok', message: 'Minimal API health is working', dbTest: results });
  } catch (err: any) {
    console.error('[DEBUG] DB health check error:', err);
    res.status(500).json({ status: 'error', message: 'DB health check failed', error: err.message });
  }
});

// Users endpoint: query Users table
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

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[DEBUG] Error handler:', err);
  res.status(500).json({ status: 'error', error: err.message || 'Unknown error' });
});

app.listen(PORT, () => {
  console.log(`[DEBUG] Minimal API server running on port ${PORT}`);
});
