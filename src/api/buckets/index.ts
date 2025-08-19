import { Router, Request, Response } from 'express';
import { createFolder, deleteFolder } from '../../services/ftp';

export default function createBucketsRouter(db: any, jwtAuthMiddleware: any) {
  const router = Router();

  // POST /buckets - create a new bucket
  router.post('/', jwtAuthMiddleware, async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { name, targetFTPfolder } = req.body;
    if (!name || !targetFTPfolder) {
      return res.status(400).json({ error: 'name and targetFTPfolder are required' });
    }
    let bucket;
    try {
      // 1. Create the folder via FTP first
      await createFolder(targetFTPfolder);
      // 2. If successful, create the DB record
      bucket = await db.Bucket.create({ name, targetFTPfolder, userId: user.id });
      res.status(201).json({ bucket });
    } catch (err: any) {
      // If DB creation fails after FTP, try to clean up FTP folder
      if (!bucket) {
        try { await deleteFolder(targetFTPfolder); } catch (e) { /* ignore */ }
      }
      res.status(500).json({ error: 'Failed to create bucket', details: err.message });
    }
  });

  // GET /buckets - list all buckets for the user
  router.get('/', jwtAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const buckets = await db.Bucket.findAll({ where: { userId: user.id } });
      res.json({ buckets });
    } catch (err: any) {
      console.error('Error in GET /buckets:', err);
      res.status(500).json({ error: 'Internal server error', details: err.message });
    }
  });

  return router;
}
