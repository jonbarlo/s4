import { QueryInterface, Sequelize, QueryTypes } from 'sequelize';

export const up = async ({ context }: { context: QueryInterface & { sequelize: Sequelize } }) => {
  // Fetch all users
  const users = await context.sequelize.query<{ id: number; username: string }>(
    'SELECT id, username FROM Users;',
    { type: QueryTypes.SELECT }
  );
  // Pick the first two users (or repeat if only one exists)
  const user1 = users[0]?.id || 1;
  const user2 = users[1]?.id || user1;

  await context.bulkInsert('Buckets', [
    {
      name: 'bucket1',
      targetFTPfolder: 'bucket1-folder',
      userId: user1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: 'bucket2',
      targetFTPfolder: 'bucket2-folder',
      userId: user2,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ], {});
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await context.bulkDelete('Buckets', {}, {});
};
