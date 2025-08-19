import { QueryInterface, QueryTypes } from 'sequelize';

export const up = async ({ context }: { context: QueryInterface }) => {
  const isTest = process.env.NODE_ENV === 'test' || process.env.DB_DIALECT === 'sqlite';
  const usersTable = isTest ? 'Users' : '[scams3_root].[Users]';
  const bucketsTable = isTest ? 'Buckets' : { tableName: 'Buckets', schema: 'scams3_root' };
  try {
    // Fetch all users
    const users = await context.sequelize.query<{ id: number; username: string }>(
      `SELECT id, username FROM ${usersTable};`,
      { type: QueryTypes.SELECT }
    );
    const user1 = users[0]?.id || 1;
    const user2 = users[1]?.id || user1;
    await context.bulkInsert(bucketsTable, [
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
  const isTest = process.env.NODE_ENV === 'test' || process.env.DB_DIALECT === 'sqlite';
  const bucketsTable = isTest ? 'Buckets' : { tableName: 'Buckets', schema: 'scams3_root' };
  await context.bulkDelete(bucketsTable, {}, {});
};
