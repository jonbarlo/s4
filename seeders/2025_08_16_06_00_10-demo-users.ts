import { QueryInterface } from 'sequelize';

export const up = async ({ context }: { context: QueryInterface }) => {
  await context.bulkInsert('Users', [
    { username: 'alice', apiKey: 'alice-key', createdAt: new Date(), updatedAt: new Date() },
    { username: 'bob', apiKey: 'bob-key', createdAt: new Date(), updatedAt: new Date() }
  ], {});
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await context.bulkDelete('Users', {}, {});
};
