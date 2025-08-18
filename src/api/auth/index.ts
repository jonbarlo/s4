import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// Accept db as a parameter
export default function createAuthRouter(db: any) {
  const router = Router();

  router.get('/debug-models', (req, res) => {
    res.json({ models: Object.keys(db) });
  });

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
