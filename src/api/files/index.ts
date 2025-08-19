import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { uploadFile, deleteFile } from '../../services/ftp';

const upload = multer({ dest: 'uploads/' });

export default function createFilesRouter(db: any, jwtAuthMiddleware: any) {
  const router = Router();

  // POST /files - upload a file and create a DB record
  router.post('/', jwtAuthMiddleware, upload.single('file'), async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { bucketId, targetFTPfolder } = req.body;
    if (!req.file || !bucketId || !targetFTPfolder) {
      return res.status(400).json({ error: 'file, bucketId, and targetFTPfolder are required' });
    }
    const localPath = req.file.path;
    const remotePath = path.posix.join(targetFTPfolder, req.file.originalname);
    let fileRecord;
    try {
      // 1. Upload file to FTP
      await uploadFile(remotePath, localPath);
      // 2. Create DB record
      fileRecord = await db.File.create({
        filename: req.file.originalname,
        size: req.file.size,
        uploadedAt: new Date(),
        bucketId,
        userId: user.id,
        targetFTPfolder,
      });
      res.status(201).json({ file: fileRecord });
    } catch (err: any) {
      // Clean up FTP and local file if needed
      if (!fileRecord) {
        try { await deleteFile(remotePath); } catch (e) { /* ignore */ }
      }
      res.status(500).json({ error: 'Failed to upload file', details: err.message });
    } finally {
      // Always remove the local file
      fs.unlink(localPath, () => {});
    }
  });

  // GET /files - list all files for the user
  router.get('/', jwtAuthMiddleware, async (req: Request, res: Response) => {
    const user = (req as any).user;
    const files = await db.File.findAll({ where: { userId: user.id } });
    res.json({ files });
  });

  return router;
}
