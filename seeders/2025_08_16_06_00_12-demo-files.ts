import { QueryInterface } from 'sequelize';

export const up = async ({ context }: { context: QueryInterface }) => {
  await context.bulkInsert('Files', [
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
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await context.bulkDelete('Files', {}, {});
};
