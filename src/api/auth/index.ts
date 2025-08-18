import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import db from '../../models';
import { jwtAuthMiddleware } from '../../middlewares/auth';
import bcrypt from 'bcrypt';
import type { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required. Refusing to start with insecure default.');
}
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

const signOptions: SignOptions = { expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn'] };

// POST /auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  console.log('About to fetch user:', username);
  try {
    const user = await db.User.findOne({
      where: { username },
      attributes: ['id', 'username', 'apiKey', 'password', 'createdAt', 'updatedAt', 'permissions']
    });
    console.log('User from DB:', user);
    if (!user) {
      console.log('User not found in DB!');
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (!user.password) {
      console.error('User password is null or undefined:', user);
      return res.status(500).json({ error: 'User password is missing in DB' });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', passwordMatch);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    // Generate new apiKey
    const newApiKey = crypto.randomBytes(32).toString('hex');
    await db.User.update({ apiKey: newApiKey }, { where: { id: user.id } });
    // Issue JWT
    const token = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      signOptions
    );
    res.json({ token });
  } catch (err) {
    console.error('Sequelize error:', err);
    if (err instanceof Error) {
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
    }
    throw err;
  }
});

// GET /auth/validate
router.get('/validate', jwtAuthMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user;
  // If user is a Sequelize instance, extract plain values
  const plain = user.get ? user.get({ plain: true }) : user;
  // Only return allowed fields
  const { id, username, createdAt, updatedAt } = plain;
  res.json({ valid: true, identity: { id, username, createdAt, updatedAt } });
});

// POST /auth/apikey/create
router.post('/apikey/create', jwtAuthMiddleware, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const key = crypto.randomBytes(32).toString('hex');
  const apiKey = await db.ApiKey.create({
    userId: user.id,
    key
  });
  res.json({ apiKey: apiKey.key });
});

// GET /auth/apikeys - list all API keys for the authenticated user
router.get('/apikeys', jwtAuthMiddleware, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const apiKeys = await db.ApiKey.findAll({
    where: { userId: user.id },
    attributes: ['id', 'key', 'createdAt', 'updatedAt'],
    order: [['createdAt', 'DESC']]
  });
  res.json({ apiKeys });
});

// DELETE /auth/apikey/:id - delete a specific API key by ID
router.delete('/apikey/:id', jwtAuthMiddleware, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { id } = req.params;
  const apiKey = await db.ApiKey.findOne({ where: { id, userId: user.id } });
  if (!apiKey) {
    return res.status(404).json({ error: 'API key not found' });
  }
  await apiKey.destroy();
  res.json({ success: true });
});

export default router;
