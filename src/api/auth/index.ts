import { Router } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

router.post('/login', (req, res) => {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    return res.status(500).json({
      status: 'error',
      message: 'JWT_SECRET environment variable is required. Refusing to start with insecure default.'
    });
  }
  try {
    const token = jwt.sign({ test: true }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ status: 'ok', message: 'Login endpoint hit', token });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: 'Login error', error: err.message, stack: err.stack });
  }
});

export default router;
