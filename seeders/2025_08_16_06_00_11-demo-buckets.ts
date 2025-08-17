import { QueryInterface } from 'sequelize';

export const up = async ({ context }: { context: QueryInterface }) => {
  await context.bulkInsert('Buckets', [
    { name: 'bucket1', createdAt: new Date(), updatedAt: new Date() },
    { name: 'bucket2', createdAt: new Date(), updatedAt: new Date() }
  ], {});
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await context.bulkDelete('Buckets', {}, {});
};
