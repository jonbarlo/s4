import { QueryInterface } from 'sequelize';
import bcrypt from 'bcrypt';

export const up = async ({ context }: { context: QueryInterface }) => {
  const isTest = process.env.NODE_ENV === 'test' || process.env.DB_DIALECT === 'sqlite';
  const table = isTest ? 'Users' : { tableName: 'Users', schema: 'scams3_root' };
  console.log(`[Seeder] Using table:`, table, '| NODE_ENV:', process.env.NODE_ENV, '| DB_DIALECT:', process.env.DB_DIALECT);

  const alicePlain = 'alice-password';
  const bobPlain = 'bob-password';
  const users = [
    {
      username: 'alice',
      password: await bcrypt.hash(alicePlain, 10),
      apiKey: 'alice-key',
      permissions: 'FULL_CONTROL',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      username: 'bob',
      password: await bcrypt.hash(bobPlain, 10),
      apiKey: 'bob-key',
      permissions: 'READ',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ];
  try {
    await context.bulkInsert(table, users, {});
    console.log('Seeded users:', users);
    console.log('alice | password:', alicePlain, '| apiKey: alice-key | permissions: FULL_CONTROL');
    console.log('bob   | password:', bobPlain, '| apiKey: bob-key | permissions: READ');
  } catch (err) {
    console.error('Seeder error (users up):', err);
    throw err;
  }
};

export const down = async ({ context }: { context: QueryInterface }) => {
  const isTest = process.env.NODE_ENV === 'test' || process.env.DB_DIALECT === 'sqlite';
  const table = isTest ? 'Users' : { tableName: 'Users', schema: 'scams3_root' };
  console.log(`[Seeder] (down) Using table:`, table, '| NODE_ENV:', process.env.NODE_ENV, '| DB_DIALECT:', process.env.DB_DIALECT);
  await context.bulkDelete(table, {}, {});
};
