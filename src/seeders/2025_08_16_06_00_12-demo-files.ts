import { QueryInterface } from 'sequelize';

export const up = async ({ context }: { context: QueryInterface }) => {
  const isTest = process.env.NODE_ENV === 'test' || process.env.DB_DIALECT === 'sqlite';
  const filesTable = isTest ? 'Files' : { tableName: 'Files', schema: 'scams3_root' };
  try {
    await context.bulkInsert(filesTable, [
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
  const isTest = process.env.NODE_ENV === 'test' || process.env.DB_DIALECT === 'sqlite';
  const filesTable = isTest ? 'Files' : { tableName: 'Files', schema: 'scams3_root' };
  await context.bulkDelete(filesTable, {}, {});
};
