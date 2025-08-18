import { Router, Request, Response } from 'express';
import db from '../../models';
import { jwtAuthMiddleware } from '../../middlewares/auth';

const router = Router();

// POST /folders - create a new folder (virtual, in DB)
router.post('/', jwtAuthMiddleware, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { name, bucketId } = req.body;
  if (!name || !bucketId) {
    return res.status(400).json({ error: 'name and bucketId are required' });
  }
  // For now, folders are just a prefix in the DB (virtual)
  // Optionally, you could create a Folder table/model
  // Here, we just return the folder info
  res.status(201).json({ folder: { name, bucketId, userId: user.id } });
});

// GET /folders - list all folders for the user (virtual, from Files table)
router.get('/', jwtAuthMiddleware, async (req: Request, res: Response) => {
  const user = (req as any).user;
  // Assume folders are unique prefixes in Files.targetFTPfolder for this user
  const folders = await db.File.findAll({
    where: { userId: user.id },
    attributes: ['targetFTPfolder'],
    group: ['targetFTPfolder']
  });
  res.json({ folders });
});

export default router;
