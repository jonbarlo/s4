import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// Accept db as a parameter
export default function createAuthRouter(db: any) {
  const router = Router();

  /**
   * @openapi
   * /auth/debug-models:
   *   get:
   *     summary: Debug endpoint to show available database models
   *     description: Returns a list of all available database models for debugging purposes
   *     tags: [Debug]
   *     responses:
   *       200:
   *         description: List of available models
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 models:
   *                   type: array
   *                   items:
   *                     type: string
   *                   example: ["User", "Bucket", "File", "ApiKey"]
   */
  router.get('/debug-models', (req, res) => {
    res.json({ models: Object.keys(db) });
  });

  /**
   * @openapi
   * /auth/login:
   *   post:
   *     summary: Authenticate user and get JWT token
   *     description: Authenticates a user with username and password, returns a JWT token for API access
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - username
   *               - password
   *             properties:
   *               username:
   *                 type: string
   *                 description: User's username
   *                 example: "alice"
   *               password:
   *                 type: string
   *                 description: User's password
   *                 example: "alice-password"
   *     responses:
   *       200:
   *         description: Authentication successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: "ok"
   *                 token:
   *                   type: string
   *                   description: JWT token for API access
   *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   *       400:
   *         description: Missing username or password
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
   *                   example: "Username and password are required."
   *       401:
   *         description: Invalid credentials
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
   *                   example: "Invalid username or password."
   *       500:
   *         description: Server error
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
   *                   example: "JWT_SECRET environment variable is required."
   */
  router.post('/login', async (req, res) => {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      return res.status(500).json({
        status: 'error',
        message: 'JWT_SECRET environment variable is required.'
      });
    }

    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ status: 'error', message: 'Username and password are required.' });
    }

    if (!db.User) {
      return res.status(500).json({
        status: 'error',
        message: 'User model is not loaded.',
        debug: { dbUserType: typeof db.User, dbKeys: Object.keys(db) }
      });
    }

    let user;
    try {
      user = await db.User.findOne({ where: { username } });
    } catch (err) {
      const error = err as Error;
      return res.status(500).json({
        status: 'error',
        message: 'DB user lookup failed',
        debug: { error: error.message, stack: error.stack }
      });
    }

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid username or password.',
        debug: { user: null, username }
      });
    }

    let valid;
    try {
      valid = await bcrypt.compare(password, user.password);
    } catch (err) {
      const error = err as Error;
      return res.status(500).json({
        status: 'error',
        message: 'Password hash comparison failed',
        debug: { error: error.message, stack: error.stack }
      });
    }

    if (!valid) {
      return res.status(401).json({ status: 'error', message: 'Invalid username or password.' });
    }

    try {
      const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
      res.json({ status: 'ok', token });
    } catch (err) {
      const error = err as Error;
      res.status(500).json({
        status: 'error',
        message: 'JWT signing failed',
        debug: { error: error.message, stack: error.stack }
      });
    }
  });

  return router;
}
