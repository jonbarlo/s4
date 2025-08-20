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
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';

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

// CORS middleware: allow all origins for public API
app.use(cors());

// Swagger/OpenAPI setup
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'S4 Bucket API',
    version: '1.0.0',
    description: 'OpenAPI documentation for the S4 Bucketpublic API.'
  },
  servers: [
    { url: 'https://api.s4.506software.com', description: 'Production' },
    { url: 'http://localhost:3000', description: 'Local' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [{ bearerAuth: [] }],
};
const swaggerOptions = {
  swaggerDefinition,
  apis: ['./src/api/**/*.ts', './src/app.ts'], // JSDoc comments in routers and here
};
const swaggerSpec = swaggerJSDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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

/**
 * @openapi
 * /:
 *   get:
 *     summary: Root endpoint
 *     description: Simple health check endpoint that returns 'ok'
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is running
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "ok"
 */
app.get('/', (req, res) => res.send('ok'));

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Database health check
 *     description: Performs a database connectivity test and returns the result
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Health check passed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                 message:
 *                   type: string
 *                   example: "Health check passed"
 *                 dbTest:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       result:
 *                         type: integer
 *                         example: 2
 *       500:
 *         description: Database health check failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Sequelize not initialized"
 */
app.get('/health', async (req, res) => {
  if (!sequelize) {
    return res.status(500).json({ status: 'error', message: 'Sequelize not initialized' });
  }
  try {
    const [results] = await sequelize.query('SELECT 1+1 AS result');
    res.json({ status: 'ok', message: 'Health check passed', dbTest: results });
  } catch (err: any) {
    console.error('[ERROR] /health:', err);
    res.status(500).json({ status: 'error', message: 'DB health check failed' });
  }
});

/**
 * @openapi
 * /users:
 *   get:
 *     summary: List all users
 *     description: Returns a list of all users in the system (admin endpoint)
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       username:
 *                         type: string
 *                         example: "alice"
 *                       password:
 *                         type: string
 *                         example: "$2b$10$fpiIM2XA8UxjbvqVyON3qOi6HUvxJnKqqNEzXTU4PtEKbAX3HjZjW"
 *                       apiKey:
 *                         type: string
 *                         example: "58ce4d245955abb1886599eedd9f57c090a0a54441d410c5e6763882648ce296"
 *                       permissions:
 *                         type: string
 *                         example: "FULL_CONTROL"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-08-18T04:23:43.168Z"
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-08-18T04:23:59.409Z"
 *       500:
 *         description: Failed to fetch users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Failed to fetch users"
 */
app.get('/users', async (req, res) => {
  if (!sequelize) {
    return res.status(500).json({ status: 'error', message: 'Sequelize not initialized' });
  }
  try {
    const [results] = await sequelize.query('SELECT * FROM [scams3_root].[Users]');
    res.json({ status: 'ok', users: results });
  } catch (err: any) {
    console.error('[ERROR] /users:', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch users' });
  }
});

// Restore authentication and all main routers
const jwtAuthMiddleware = createJwtAuthMiddleware(db);
app.use('/auth', createAuthRouter(db));
app.use('/buckets', createBucketsRouter(db, jwtAuthMiddleware));
app.use('/files', createFilesRouter(db, jwtAuthMiddleware));
app.use('/folders', createFoldersRouter(db, jwtAuthMiddleware));

// Global error handler: never return stack traces or sensitive info
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[ERROR] Unhandled error:', err);
  res.status(500).json({ status: 'error', message: 'Internal server error' });
});

export default app;
