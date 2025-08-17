import { Router, Request, Response } from 'express';
import db from '../../../models';
import { jwtAuthMiddleware } from '../../middlewares/auth';

const router = Router();

// POST /files - create a new file (metadata only)
router.post('/', jwtAuthMiddleware, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { filename, size, uploadedAt, bucketId, targetFTPfolder } = req.body;
  if (!filename || !size || !uploadedAt || !bucketId || !targetFTPfolder) {
    return res.status(400).json({ error: 'filename, size, uploadedAt, bucketId, and targetFTPfolder are required' });
  }
  const file = await db.File.create({ filename, size, uploadedAt, bucketId, userId: user.id, targetFTPfolder });
  res.status(201).json({ file });
});

// GET /files - list all files for the user
router.get('/', jwtAuthMiddleware, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const files = await db.File.findAll({ where: { userId: user.id } });
  res.json({ files });
});

export default router;
