import { Router, Request, Response } from 'express';

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

  return router;
}
