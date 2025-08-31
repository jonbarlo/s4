import { Router, Request, Response } from 'express';
import { deleteFile } from '../../services/ftp';

export default function createFoldersRouter(db: any, jwtAuthMiddleware: any) {
  const router = Router();

  /**
   * @openapi
   * /folders:
   *   post:
   *     summary: Create a new virtual folder
   *     description: Creates a new virtual folder entry in the database (folders are represented as prefixes in the Files table)
   *     tags: [Folders]
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
   *               - bucketId
   *             properties:
   *               name:
   *                 type: string
   *                 description: Name of the folder
   *                 example: "documents"
   *               bucketId:
   *                 type: integer
   *                 description: ID of the bucket to create the folder in
   *                 example: 1
   *     responses:
   *       201:
   *         description: Folder created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 folder:
   *                   type: object
   *                   properties:
   *                     name:
   *                       type: string
   *                       example: "documents"
   *                     bucketId:
   *                       type: integer
   *                       example: 1
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
   *                   example: "name and bucketId are required"
   */
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

  /**
   * @openapi
   * /folders:
   *   get:
   *     summary: List all virtual folders for the authenticated user
   *     description: Returns all unique folder prefixes from the Files table for the authenticated user
   *     tags: [Folders]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of user's folders
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 folders:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       targetFTPfolder:
   *                         type: string
   *                         description: FTP folder path representing the folder
   *                         example: "/uploads/my-bucket/documents"
   */
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

  /**
   * @openapi
   * /folders:
   *   delete:
   *     summary: Delete all files in a specific folder
   *     description: Deletes all files within a specific folder path from both the database and FTP server
   *     tags: [Folders]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - folderPath
   *               - bucketId
   *             properties:
   *               folderPath:
   *                 type: string
   *                 description: The folder path to delete (e.g., "documents" or "documents/subfolder")
   *                 example: "documents"
   *               bucketId:
   *                 type: integer
   *                 description: ID of the bucket containing the folder
   *                 example: 1
   *     responses:
   *       200:
   *         description: Folder contents deleted successfully
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
   *                   example: "Folder contents deleted"
   *                 deletedFiles:
   *                   type: integer
   *                   description: Number of files that were deleted
   *                   example: 3
   *       400:
   *         description: Missing required fields
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *                   example: "folderPath and bucketId are required"
   *       404:
   *         description: Folder not found or no files to delete
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *                   example: "No files found in specified folder"
   *       500:
   *         description: Server error during folder deletion
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *                   example: "Failed to delete folder contents"
   *                 details:
   *                   type: string
   *                   example: "FTP connection failed"
   */
  router.delete('/', jwtAuthMiddleware, async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { folderPath, bucketId } = req.body;
    
    if (!folderPath || !bucketId) {
      return res.status(400).json({ error: 'folderPath and bucketId are required' });
    }

    try {
      // Verify bucket ownership
      const bucket = await db.Bucket.findOne({ where: { id: bucketId, userId: user.id } });
      if (!bucket) {
        return res.status(404).json({ error: 'Bucket not found' });
      }

      // Construct the full folder path
      const fullFolderPath = `${bucket.targetFTPfolder}/${folderPath}`;
      
      // Find all files in this specific folder
      const files = await db.File.findAll({
        where: { 
          userId: user.id,
          bucketId,
          targetFTPfolder: fullFolderPath
        }
      });

      if (files.length === 0) {
        return res.status(404).json({ error: 'No files found in specified folder' });
      }

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
      await db.File.destroy({
        where: { 
          userId: user.id,
          bucketId,
          targetFTPfolder: fullFolderPath
        }
      });

      res.json({ 
        status: 'ok', 
        message: 'Folder contents deleted',
        deletedFiles: files.length
      });
    } catch (err: any) {
      console.error('Error deleting folder contents:', err);
      res.status(500).json({ error: 'Failed to delete folder contents', details: err.message });
    }
  });

  return router;
}
