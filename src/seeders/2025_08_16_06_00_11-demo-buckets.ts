import { QueryInterface, Sequelize, QueryTypes } from 'sequelize';

export const up = async ({ context }: { context: QueryInterface & { sequelize: Sequelize } }) => {
  try {
    // Fetch all users
    const users = await context.sequelize.query<{ id: number; username: string }>(
      'SELECT id, username FROM [scams3_root].[Users];',
      { type: QueryTypes.SELECT }
    );
    // Pick the first two users (or repeat if only one exists)
    const user1 = users[0]?.id || 1;
    const user2 = users[1]?.id || user1;

    await context.bulkInsert({ tableName: 'Buckets', schema: 'scams3_root' }, [
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
  } catch (err) {
    console.error('Seeder error (buckets up):', err);
    throw err;
  }
};

export const down = async ({ context }: { context: QueryInterface }) => {
  try {
    await context.bulkDelete({ tableName: 'Buckets', schema: 'scams3_root' }, {}, {});
  } catch (err) {
    console.error('Seeder error (buckets down):', err);
    throw err;
  }
};
