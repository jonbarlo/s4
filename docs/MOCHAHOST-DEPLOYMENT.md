# 🚨 CRITICAL: Environment Variable Loading & .env Path Troubleshooting for Mochahost 🚨

**To avoid the most common and frustrating deployment bugs on Mochahost (and similar shared hosts), follow these steps exactly:**

## 1. Always keep your `.env` file in the project root (never in `dist/` or any subfolder).  
## 2. Match your dotenv path logic to your build output location:

| Entry Point Location         | dotenv Path Logic                                      |
|-----------------------------|--------------------------------------------------------|
| `dist/index.js`             | `path.resolve(__dirname, '../.env')`                   |
| `dist/src/app.js`           | `path.resolve(__dirname, '../../.env')`                |
| `dist/src/minimal.js`       | `path.resolve(__dirname, '../../.env')`                |

**Example for `dist/src/app.js` or `dist/src/minimal.js`:**
```js
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
```

**Example for `dist/index.js`:**
```js
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });
```

## 3. Debugging: Add this to your API response or logs during deployment
```js
const envPath = path.resolve(__dirname, '../../.env'); // or '../.env' as appropriate
const envExists = require('fs').existsSync(envPath);
res.json({
  ENV_PATH: envPath,
  envExists,
  CWD: process.cwd(),
  __dirname: __dirname,
  env: {
    NODE_ENV: process.env.NODE_ENV,
    DB_HOST: process.env.DB_HOST
  }
});
```
- This will show you exactly where your app is looking for `.env` and whether it exists.

## 4. Deployment Checklist
- [ ] `.env` is in the project root (not in `dist/`)
- [ ] Your entry point in `web.config` matches your build output (e.g., `dist/src/app.js` or `dist/index.js`)
- [ ] Your dotenv path logic matches your entry point location
- [ ] Debug output confirms `envExists: true` and correct ENV_PATH
- [ ] Remove or restrict debug output before going to production

## 5. Summary Table
| Scenario                | Entry File Location         | .env Path Logic                        |
|-------------------------|----------------------------|----------------------------------------|
| Most conventional       | dist/index.js              | path.resolve(__dirname, '../.env')     |
| Nested entry (legacy)   | dist/src/app.js            | path.resolve(__dirname, '../../.env')  |

## 6. Warning
- **Mismatched path logic is the #1 cause of production bugs on shared hosting.**
- Always verify your build output and adjust your dotenv path accordingly.
- Never copy `.env` into `dist/`—always reference it from the project root.

---

# Mochahost IIS Node.js Deployment Guide

**CRITICAL: Always output your main app entry file (e.g., index.js or server.js) to dist/ (not dist/src/). Keep your .env file in the project root. Use dotenv.config({ path: path.resolve(__dirname, '../.env') }) for both development and production. This ensures reliable environment variable loading and simple deployment.**

This guide explains how to deploy your Node.js API to Mochahost shared IIS hosting using iisnode, with the correct web.config and environment variable setup.

## Key Points
- Mochahost uses IIS with iisnode to run Node.js apps.
- You must use a custom `web.config` for full control.
- Environment variables can be set via `.env` file in your app root.
- Logging must be disabled in iisnode to avoid permission errors.
- **CRITICAL**: Your app runs from the `dist/` directory, but `.env` file must be in the parent directory.
- **CRITICAL**: Never bind to a port when running under IIS - use `process.env.IIS_NODE_VERSION` check.

## 1. web.config Example (Working)

Place this file in your app root:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <!-- Disable logging to avoid permission errors, enable dev errors for debugging -->
    <iisnode loggingEnabled="false" devErrorsEnabled="true" nodeProcessCommandLine="C:\Program Files\nodejs\node.exe"/>
    <!-- Register iisnode handler -->
    <handlers>
      <add name="iisnode" path="*.js" verb="*" modules="iisnode"/>
    </handlers>
    <!-- Rewrite rule - all requests go to main app entry point -->
    <rewrite>
      <rules>
        <rule name="MainApp">
          <action type="Rewrite" url="dist/index.js"/>
        </rule>
      </rules>
    </rewrite>
    <tracing>
      <traceFailedRequests>
        <clear/>
      </traceFailedRequests>
    </tracing>
  </system.webServer>
</configuration>
```

- This routes all requests to your main app (`dist/index.js`).
- Disables iisnode logging (fixes permission errors).
- Enables dev errors for easier debugging.
- Ensures the correct Node.js binary is used.

## 2. Environment Variables

**CRITICAL ISSUE RESOLVED:** Your Node.js app runs from the `dist/` directory, but the `.env` file must be in the parent directory.

**Recommended:** Use a `.env` file in your app root (same directory as `web.config`). Example:

```
NODE_ENV=production
DB_HOST=mssql001.a.b-c-d.com
DB_NAME=a-b-c
DB_USERNAME=defaultUser
DB_PASSWORD=your-password
DB_PORT=1433
APP_NAME=S4-Bucket-API-Production
VERSION=1.0.0
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=24h
```

**Environment Loading Fix:**
In your Node.js code, use this pattern to correctly load the `.env` file:

```javascript
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from parent directory
const envPath = path.resolve(process.cwd(), '..', '.env');
dotenv.config({ path: envPath });
```

**CRITICAL: Server Startup Logic**
When running under IIS, you must NOT bind to a port. Use this pattern:

```javascript
// Only start server if not running under IIS
if (process.env.NODE_ENV !== 'production' || !process.env.IIS_NODE_VERSION) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
```

**Why this matters:**
- IIS manages the port binding automatically
- If your app tries to bind to a port when running under IIS, it will cause a 500 error
- The `process.env.IIS_NODE_VERSION` check prevents this issue

**Directory Structure on Server:**
```
your-app-domain.com/
├── .env                    ← .env file here (app root)
├── package.json
├── web.config
└── dist/                   ← app runs from here
    └── index.js
```

- Do **not** commit `.env` to version control.
- Mochahost will load this file if your app uses `dotenv` correctly.

## Environment Variable Path Discrepancy: Development vs Production

**IMPORTANT:** When deploying to Mochahost (or any IIS shared hosting), your Node.js app runs from the compiled JavaScript in the `dist/` directory, but your `.env` file should remain in the project root (one level above `dist/`).

- In **both development and production**, if your entry file is in `src/` and compiles to `dist/`, you should load `.env` from the project root using:
  ```js
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
  ```
  (Assuming your entry file is in `src/` and compiles to `dist/`.)

**Example:**
```js
// Always load .env from project root (one level up from dist/index.js or src/index.ts)
dotenv.config({ path: path.resolve(__dirname, '../.env') });
```

**Why this matters:**
- If you use the wrong path, your app will not load environment variables in production, leading to connection failures and missing config.
- Always verify the resolved path using debug output or by returning it in an API response during troubleshooting.

**Troubleshooting:**
- If your environment variables are missing in production, check the resolved path and ensure `.env` is present in the project root (not in `dist/`).
- You can add a debug endpoint to your API to return the resolved path and current working directory for verification.

## **IMPORTANT: Main App Entry File Location**

**Always configure your TypeScript build so your main app entry file (e.g., `index.js` or `server.js`) is output directly to `dist/`, not to a subfolder like `dist/src/`.**

- This ensures your `web.config` rewrite rule is simple (e.g., `dist/index.js`) and avoids path confusion.
- If you output to `dist/src/`, you will need to adjust your rewrite rules and .env path logic, which is error-prone and harder to maintain.

**Recommended tsconfig.json for correct output:**
```json
{
  "compilerOptions": {
    "target": "es2019",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"]
}
```
- With this config, `src/index.ts` will compile to `dist/index.js`.
- Your `web.config` should then use:
  ```xml
  <action type="Rewrite" url="dist/index.js"/>
  ```

**Summary:**
- Keep your entry point in `dist/` for simplicity and reliability.
- Avoid outputting to `dist/src/` or other subfolders unless absolutely necessary (and document any path changes if you do).

## 3. Deployment Steps

1. **Deploy using the automated script:**
   ```bash
   npm run deploy:mochahost
   ```
   This will:
   - Upload source files (`src/` folder)
   - Upload configuration files (`package.json`, `web.config`, `.env`)
   - Show progress tracking for all uploaded files

2. **On the server (Plesk console):**
   ```bash
   npm install --production
   npm run build
   ```
   This creates the `dist/` folder with compiled JavaScript files that the `web.config` expects.

3. **Restart the IIS application in Plesk**
4. **Test your endpoints:**
   - `/` (root)
   - `/health`
   - `/env-test`
   - `/db-test`

**CRITICAL: TypeScript Compilation**
- IIS runs compiled JavaScript files, not TypeScript files directly
- The `web.config` points to `dist/index.js` (compiled version)
- TypeScript imports (like `./utils/logger`) will fail if running `.ts` files directly
- Always build on the server to create the `dist/` folder before testing

## 4. Testing and Debugging

**CRITICAL: Environment Variable Loading Fix**

The application runs from the `dist/` directory on the server, but the `.env` file is in the root directory. This requires explicit path resolution:

```javascript
// Always look in parent directory since app runs from dist/ but .env is in root
const envPath = path.resolve(process.cwd(), '..', '.env');
dotenv.config({ path: envPath });
```

**CRITICAL: TypeScript Import Issues**
- TypeScript imports (like `./utils/logger`) will fail if running `.ts` files directly
- IIS needs compiled JavaScript files from the `dist/` folder
- The `web.config` points to `dist/index.js`, not `src/index.ts`
- Always ensure `npm run build` has been run on the server before testing

**Debug Information:**
- Server `cwd`: `C:\Inetpub\vhosts\506software.com\pos-engine.506software.com\dist`
- Correct `.env` path: `C:\Inetpub\vhosts\506software.com\pos-engine.506software.com\.env`
- The app runs from `dist/` but `.env` is in the parent directory
- Compiled JavaScript files are in `dist/` folder

**Create Test Endpoints for Validation:**
Add these endpoints to your API for deployment validation:

```javascript
// Environment variables test
app.get('/env-test', (req, res) => {
  res.json({
    success: true,
    message: 'Environment variables check',
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      DB_HOST: process.env.DB_HOST,
      DB_NAME: process.env.DB_NAME,
      DB_USERNAME: process.env.DB_USERNAME,
      DB_PASSWORD: process.env.DB_PASSWORD ? '***set***' : 'not set',
      DB_PORT: process.env.DB_PORT,
      PORT: process.env.PORT,
    },
    debug: {
      envPath: path.resolve(process.cwd(), '..', '.env'),
      envExists: fs.existsSync(path.resolve(process.cwd(), '..', '.env')),
      cwd: process.cwd(),
    }
  });
});

// Database connection test
app.get('/db-test', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query('SELECT 1 as test');
    await pool.close();
    res.json({
      success: true,
      message: 'Database connection successful',
      result: result.recordset[0]
    });
  } catch (error) {
    res.json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});
```

**Validation Checklist:**
- ✅ Server responds to `/` endpoint
- ✅ Environment variables load correctly (`/env-test`)
- ✅ Database connection works (`/db-test`)
- ✅ All required endpoints function properly

## 5. Troubleshooting

**Environment Variables Not Loading:**
- **Symptom**: Database connection fails with "localhost" or default values
- **Cause**: `.env` file not found or not loaded correctly
- **Solution**: Ensure `.env` file is in app root (parent of `dist/`) and use correct path in code

**Common Issues:**
- If you see 500 errors and no logs, check that `loggingEnabled="false"` in `web.config`.
- If only `/` and `/health` work, make sure you are deploying the latest build and that `dist/index.js` is your main entry point.
- If environment variables are missing, check your `.env` file and ensure it is in the app root (not in `dist/`).
- If you get permission errors, contact Mochahost support and ask them to ensure the IIS application pool identity has read/write access to your app directory.

**Debugging Environment Issues:**
Add this debugging code to identify environment loading problems:

```javascript
import fs from 'fs';

const envPath = path.resolve(process.cwd(), '..', '.env');
const envExists = fs.existsSync(envPath);

console.log('🔧 Loading environment from:', envPath);
console.log('🔧 .env file exists:', envExists);
console.log('🔧 Current working directory:', process.cwd());
console.log('🔧 DB_HOST:', process.env.DB_HOST ? 'SET' : 'NOT SET');
```

## 6. Security Notes
- Never commit `.env` files to version control.
- Use strong, unique passwords for database and JWT secrets.
- Regularly rotate secrets and credentials.

---

**This guide reflects the current, working Mochahost IIS Node.js deployment process as confirmed by support and validated through test API deployment.** 

## Troubleshooting: Diagnosing 500 Errors Without Log Access

If you encounter a 500 error like this in your browser:

```
iisnode encountered an error when processing the request.

HRESULT: 0x2
HTTP status: 500
HTTP subStatus: 1002
HTTP reason: Internal Server Error
You are receiving this HTTP 200 response because system.webServer/iisnode/@devErrorsEnabled configuration setting is 'true'.

In addition to the log of stdout and stderr of the node.exe process, consider using debugging and ETW traces to further diagnose the problem.

You may get additional information about this error condition by logging stdout and stderr of the node.exe process. To enable logging, set the system.webServer/iisnode/@loggingEnabled configuration setting to 'true' (current value is 'false').
```

This is a classic sign of a fatal Node.js startup error—often due to missing environment variables, missing dependencies, or a crash in router mounting.

### Rapid Debugging Pattern

1. **Wrap router mounting in a try/catch:**
   ```ts
   let startupError: any = null;
   try {
     import authRouter from './api/auth';
     // ... other routers ...
     app.use('/auth', authRouter);
     // ...
   } catch (err) {
     startupError = err;
     console.error('[FATAL] Startup error:', err);
   }
   ```
2. **Add a global error middleware:**
   ```ts
   app.use((req, res, next) => {
     if (startupError) {
       return res.status(500).json({
         status: 'error',
         message: 'Startup error',
         error: startupError.message || String(startupError),
         stack: startupError.stack || null
       });
     }
     next();
   });
   ```

**Why:**
- This will return the actual startup error in every HTTP response, making it possible to debug fatal issues even when you cannot access server logs.
- Remove this code after resolving the error to avoid exposing sensitive information in production. 

## Best Practices: Error Handling and Debugging

- **Never throw exceptions at the top level in routers or middleware.**
  - Always return errors as JSON responses. This prevents fatal startup crashes and ensures your app can always respond to HTTP requests, even if there are configuration or dependency issues.
  - This is especially important on shared hosting like Mochahost, where you may not have access to server logs.
  - Replicate this pattern in all future code and reviews.

- **Remove debug code that exposes sensitive details before going live.**
  - Debug output (such as environment variables, stack traces, or internal errors) should only be present during troubleshooting.
  - Before deploying to production, clean up all debug responses to avoid leaking sensitive information. 

## CRITICAL: Use a Single Shared Sequelize Instance

- **Never create multiple Sequelize instances in your app.**
  - Only initialize Sequelize once (typically in your main app file, e.g., `app.ts`).
  - Pass the initialized models object (`db`) to all routers, middleware, and scripts that need database access.
  - Do **not** import and initialize models separately in each file—this will create multiple DB connections and cause fatal errors.

**Symptoms of the anti-pattern:**
- HTML 500 errors from IIS (not JSON), even when other endpoints work.
- Fatal startup crashes that are not caught by Express error handlers.
- Inconsistent database state or missing models in some routes.

**Correct pattern:**
- Initialize Sequelize once:
  ```ts
  import { Sequelize } from 'sequelize';
  import initializeModels from './models';
  const sequelize = new Sequelize(/* ...config... */);
  const db = initializeModels(sequelize);
  ```
- Pass `db` to all routers and middleware:
  ```ts
  import createAuthRouter from './api/auth';
  app.use('/auth', createAuthRouter(db));
  ```
- For scripts, initialize `sequelize` and `db` at the top of the script before using any models.

**Why this matters:**
- Using a single Sequelize instance ensures all parts of your app share the same DB connection and models.
- Prevents hard-to-debug fatal errors and makes your app robust for production deployment on Mochahost or any shared host. 