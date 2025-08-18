import { QueryInterface } from 'sequelize';

export const up = async ({ context }: { context: QueryInterface }) => {
  try {
    await context.bulkInsert({ tableName: 'Files', schema: 'scams3_root' }, [
      {
        filename: 'file1.txt',
        size: 1234,
        uploadedAt: new Date(),
        bucketId: 1,
        userId: 1,
        targetFTPfolder: 'bucket1-folder',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        filename: 'file2.txt',
        size: 5678,
        uploadedAt: new Date(),
        bucketId: 2,
        userId: 2,
        targetFTPfolder: 'bucket2-folder',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ], {});
  } catch (err) {
    console.error('Seeder error (files up):', err);
    throw err;
  }
};

export const down = async ({ context }: { context: QueryInterface }) => {
  try {
    await context.bulkDelete({ tableName: 'Files', schema: 'scams3_root' }, {}, {});
  } catch (err) {
    console.error('Seeder error (files down):', err);
    throw err;
  }
};
