import { Router, Request, Response } from 'express';
import db from '../../models';
import { jwtAuthMiddleware } from '../../middlewares/auth';

const router = Router();

// POST /buckets - create a new bucket
router.post('/', jwtAuthMiddleware, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { name, targetFTPfolder } = req.body;
  if (!name || !targetFTPfolder) {
    return res.status(400).json({ error: 'name and targetFTPfolder are required' });
  }
  const bucket = await db.Bucket.create({ name, targetFTPfolder, userId: user.id });
  res.status(201).json({ bucket });
});

// GET /buckets - list all buckets for the user
router.get('/', jwtAuthMiddleware, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const buckets = await db.Bucket.findAll({ where: { userId: user.id } });
  res.json({ buckets });
});

export default router;
