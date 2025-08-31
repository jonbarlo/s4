import { Router, Request, Response } from 'express';
import { createFolder, deleteFolder, deleteFile } from '../../services/ftp';

export default function createBucketsRouter(db: any, jwtAuthMiddleware: any) {
  const router = Router();

  /**
   * @openapi
   * /buckets:
   *   post:
   *     summary: Create a new bucket
   *     description: Creates a new bucket with FTP folder creation and database record
   *     tags: [Buckets]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - targetFTPfolder
   *             properties:
   *               name:
   *                 type: string
   *                 description: Name of the bucket
   *                 example: "my-bucket"
   *               targetFTPfolder:
   *                 type: string
   *                 description: FTP folder path for the bucket
   *                 example: "/uploads/my-bucket"
   *     responses:
   *       201:
   *         description: Bucket created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 bucket:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: integer
   *                       example: 1
   *                     name:
   *                       type: string
   *                       example: "my-bucket"
   *                     targetFTPfolder:
   *                       type: string
   *                       example: "/uploads/my-bucket"
   *                     userId:
   *                       type: integer
   *                       example: 1
   *       400:
   *         description: Missing required fields
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *                   example: "name and targetFTPfolder are required"
   *       500:
   *         description: Server error during bucket creation
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *                   example: "Failed to create bucket"
   *                 details:
   *                   type: string
   *                   example: "FTP connection failed"
   */
  router.post('/', jwtAuthMiddleware, async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { name, targetFTPfolder } = req.body;
    if (!name || !targetFTPfolder) {
      return res.status(400).json({ error: 'name and targetFTPfolder are required' });
    }
    let bucket;
    try {
      console.log('[DEBUG] Attempting to create FTP folder:', targetFTPfolder);
      await createFolder(targetFTPfolder);
      console.log('[DEBUG] FTP folder created successfully:', targetFTPfolder);
      // 2. If successful, create the DB record
      bucket = await db.Bucket.create({ name, targetFTPfolder, userId: user.id });
      res.status(201).json({ bucket });
    } catch (err: any) {
      console.error('[ERROR] Failed to create FTP folder or DB record:', err);
      // If DB creation fails after FTP, try to clean up FTP folder
      if (!bucket) {
        try { await deleteFolder(targetFTPfolder); } catch (e) { /* ignore */ }
      }
      res.status(500).json({ error: 'Failed to create bucket', details: err.message });
    }
  });

  /**
   * @openapi
   * /buckets:
   *   get:
   *     summary: List all buckets for the authenticated user
   *     description: Returns all buckets associated with the authenticated user
   *     tags: [Buckets]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of user's buckets
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 buckets:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: integer
   *                         example: 1
   *                       name:
   *                         type: string
   *                         example: "my-bucket"
   *                       targetFTPfolder:
   *                         type: string
   *                         example: "/uploads/my-bucket"
   *                       userId:
   *                         type: integer
   *                         example: 1
   *                       createdAt:
   *                         type: string
   *                         format: date-time
   *                         example: "2025-08-18T19:57:27.000Z"
   *                       updatedAt:
   *                         type: string
   *                         format: date-time
   *                         example: "2025-08-18T19:57:27.000Z"
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *                   example: "Internal server error"
   *                 details:
   *                   type: string
   *                   example: "Database connection failed"
   */
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

  /**
   * @openapi
   * /buckets/{id}:
   *   delete:
   *     summary: Delete a bucket and all its files
   *     description: Deletes a bucket from the database and removes all associated files from the FTP server
   *     tags: [Buckets]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Bucket ID to delete
   *         example: 1
   *     responses:
   *       200:
   *         description: Bucket deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: "ok"
   *                 message:
   *                   type: string
   *                   example: "Bucket and all files deleted"
   *                 deletedFiles:
   *                   type: integer
   *                   description: Number of files that were deleted
   *                   example: 5
   *       404:
   *         description: Bucket not found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *                   example: "Bucket not found"
   *       500:
   *         description: Server error during bucket deletion
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *                   example: "Failed to delete bucket"
   *                 details:
   *                   type: string
   *                   example: "FTP connection failed"
   */
  router.delete('/:id', jwtAuthMiddleware, async (req: Request, res: Response) => {
    const user = (req as any).user;
    const bucketId = parseInt(req.params.id);
    
    try {
      // Find the bucket and verify ownership
      const bucket = await db.Bucket.findOne({ where: { id: bucketId, userId: user.id } });
      if (!bucket) {
        return res.status(404).json({ error: 'Bucket not found' });
      }

      // Find all files in this bucket
      const files = await db.File.findAll({ where: { bucketId, userId: user.id } });
      
      // Delete all files from FTP server
      for (const file of files) {
        try {
          const remotePath = `${file.targetFTPfolder}/${file.filename}`;
          await deleteFile(remotePath);
        } catch (err) {
          console.error(`Failed to delete file ${file.filename} from FTP:`, err);
          // Continue with other files even if one fails
        }
      }

      // Delete all file records from database
      await db.File.destroy({ where: { bucketId, userId: user.id } });
      
      // Delete the bucket record
      await bucket.destroy();
      
      // Try to remove the FTP folder (this might fail if there are other files)
      try {
        await deleteFolder(bucket.targetFTPfolder);
      } catch (err) {
        console.log(`Note: Could not remove FTP folder ${bucket.targetFTPfolder} (may contain other files)`);
      }

      res.json({ 
        status: 'ok', 
        message: 'Bucket and all files deleted',
        deletedFiles: files.length
      });
    } catch (err: any) {
      console.error('Error deleting bucket:', err);
      res.status(500).json({ error: 'Failed to delete bucket', details: err.message });
    }
  });

  return router;
}
