import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { uploadFile, deleteFile, downloadFile, createFolder } from '../../services/ftp';
import os from 'os';

const upload = multer({ dest: 'uploads/' });

export default function createFilesRouter(db: any, jwtAuthMiddleware: any) {
  const router = Router();

  /**
   * @openapi
   * /files:
   *   post:
   *     summary: Upload a file and create a database record
   *     description: Uploads a file to FTP server and creates a database record linking the file to a bucket
   *     tags: [Files]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             required:
   *               - file
   *               - bucketId
   *             properties:
   *               file:
   *                 type: string
   *                 format: binary
   *                 description: File to upload
   *               bucketId:
   *                 type: integer
   *                 description: ID of the bucket to upload to
   *                 example: 1
   *               targetFTPfolder:
   *                 type: string
   *                 description: Optional subfolder within the bucket
   *                 example: "documents"
   *     responses:
   *       201:
   *         description: File uploaded successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 file:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: integer
   *                       example: 1
   *                     filename:
   *                       type: string
   *                       example: "document.pdf"
   *                     size:
   *                       type: integer
   *                       example: 1024000
   *                     bucketId:
   *                       type: integer
   *                       example: 1
   *                     userId:
   *                       type: integer
   *                       example: 1
   *                     targetFTPfolder:
   *                       type: string
   *                       example: "/uploads/my-bucket/documents"
   *                     uploadedAt:
   *                       type: string
   *                       format: date-time
   *                       example: "2025-08-18T19:57:27.000Z"
   *       400:
   *         description: Missing required fields or bucket not found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *                   example: "file and bucketId are required"
   *       500:
   *         description: Server error during file upload
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *                   example: "Failed to upload file"
   *                 details:
   *                   type: string
   *                   example: "FTP connection failed"
   */
  router.post('/', jwtAuthMiddleware, upload.single('file'), async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { bucketId } = req.body;
    let { targetFTPfolder } = req.body;
    if (!req.file || !bucketId) {
      return res.status(400).json({ error: 'file and bucketId are required' });
    }
    // Always look up the bucket
    const bucket = await db.Bucket.findOne({ where: { id: bucketId, userId: user.id } });
    if (!bucket) {
      return res.status(400).json({ error: 'Bucket not found for this user' });
    }
    // Always upload inside the bucket's folder
    let finalFTPfolder = bucket.targetFTPfolder;
    if (targetFTPfolder) {
      // If a subfolder is provided, nest it inside the bucket's folder
      finalFTPfolder = path.posix.join(bucket.targetFTPfolder, targetFTPfolder);
    }
    const localPath = req.file.path;
    const remotePath = path.posix.join(finalFTPfolder, req.file.originalname);
    let fileRecord;
    try {
      // 1. Ensure the folder exists on FTP
      await createFolder(finalFTPfolder);
      // 2. Upload file to FTP
      await uploadFile(remotePath, localPath);
      // 3. Create DB record
      fileRecord = await db.File.create({
        filename: req.file.originalname,
        size: req.file.size,
        uploadedAt: new Date(),
        bucketId,
        userId: user.id,
        targetFTPfolder: finalFTPfolder,
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

  /**
   * @openapi
   * /files:
   *   get:
   *     summary: List all files for the authenticated user
   *     description: Returns all files associated with the authenticated user
   *     tags: [Files]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of user's files
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 files:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: integer
   *                         example: 1
   *                       filename:
   *                         type: string
   *                         example: "document.pdf"
   *                       size:
   *                         type: integer
   *                         example: 1024000
   *                       bucketId:
   *                         type: integer
   *                         example: 1
   *                       userId:
   *                         type: integer
   *                         example: 1
   *                       targetFTPfolder:
   *                         type: string
   *                         example: "/uploads/my-bucket/documents"
   *                       uploadedAt:
   *                         type: string
   *                         format: date-time
   *                         example: "2025-08-18T19:57:27.000Z"
   */
  router.get('/', jwtAuthMiddleware, async (req: Request, res: Response) => {
    const user = (req as any).user;
    const files = await db.File.findAll({ where: { userId: user.id } });
    res.json({ files });
  });

  /**
   * @openapi
   * /files/{id}:
   *   delete:
   *     summary: Delete a file from FTP and database
   *     description: Deletes a file from the FTP server and removes the database record
   *     tags: [Files]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: File ID to delete
   *         example: 1
   *     responses:
   *       200:
   *         description: File deleted successfully
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
   *                   example: "File deleted"
   *       404:
   *         description: File not found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *                   example: "File not found"
   *       500:
   *         description: Server error during file deletion
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *                   example: "Failed to delete file"
   *                 details:
   *                   type: string
   *                   example: "FTP connection failed"
   */
  router.delete('/:id', jwtAuthMiddleware, async (req: Request, res: Response) => {
    const user = (req as any).user;
    const file = await db.File.findOne({ where: { id: req.params.id, userId: user.id } });
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    const remotePath = path.posix.join(file.targetFTPfolder, file.filename);
    try {
      await deleteFile(remotePath);
      await file.destroy();
      res.json({ status: 'ok', message: 'File deleted' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete file', details: err.message });
    }
  });

  /**
   * @openapi
   * /files/{id}/download:
   *   get:
   *     summary: Download a file from FTP
   *     description: Downloads a file from the FTP server and streams it to the client
   *     tags: [Files]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: File ID to download
   *         example: 1
   *     responses:
   *       200:
   *         description: File download successful
   *         content:
   *           application/octet-stream:
   *             schema:
   *               type: string
   *               format: binary
   *       404:
   *         description: File not found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *                   example: "File not found"
   *       500:
   *         description: Server error during file download
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *                   example: "Failed to download file"
   *                 details:
   *                   type: string
   *                   example: "FTP connection failed"
   */
  router.get('/:id/download', jwtAuthMiddleware, async (req: Request, res: Response) => {
    const user = (req as any).user;
    const file = await db.File.findOne({ where: { id: req.params.id, userId: user.id } });
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    const remotePath = path.posix.join(file.targetFTPfolder, file.filename);
    const tempPath = path.join(os.tmpdir(), `${Date.now()}-${file.filename}`);
    try {
      await downloadFile(remotePath, tempPath);
      res.download(tempPath, file.filename, (err) => {
        fs.unlink(tempPath, () => {});
        if (err) {
          console.error('Download error:', err);
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to download file', details: err.message });
    }
  });

  return router;
}
