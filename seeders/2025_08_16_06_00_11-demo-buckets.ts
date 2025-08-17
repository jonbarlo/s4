import { QueryInterface } from 'sequelize';

export const up = async ({ context }: { context: QueryInterface }) => {
  await context.bulkInsert('Buckets', [
    {
      name: 'bucket1',
      targetFTPfolder: 'bucket1-folder',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: 'bucket2',
      targetFTPfolder: 'bucket2-folder',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ], {});
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await context.bulkDelete('Buckets', {}, {});
};
