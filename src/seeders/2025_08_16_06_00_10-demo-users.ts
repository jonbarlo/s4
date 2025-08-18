import { QueryInterface } from 'sequelize';
import bcrypt from 'bcrypt';

export const up = async ({ context }: { context: QueryInterface }) => {
  try {
    const alicePlain = 'alice-password';
    const bobPlain = 'bob-password';
    const aliceHash = await bcrypt.hash(alicePlain, 10);
    const bobHash = await bcrypt.hash(bobPlain, 10);
    const users = [
      {
        username: 'alice',
        password: aliceHash,
        apiKey: 'alice-key',
        permissions: 'FULL_CONTROL',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        username: 'bob',
        password: bobHash,
        apiKey: 'bob-key',
        permissions: 'READ',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];
    await context.bulkInsert({ tableName: 'Users', schema: 'scams3_root' }, users, {});
    console.log('Seeded users:', users);
    console.log('alice | password:', alicePlain, '| apiKey: alice-key | permissions: FULL_CONTROL');
    console.log('bob   | password:', bobPlain, '| apiKey: bob-key | permissions: READ');
  } catch (err) {
    console.error('Seeder error (users up):', err);
    throw err;
  }
};

export const down = async ({ context }: { context: QueryInterface }) => {
  try {
    await context.bulkDelete({ tableName: 'Users', schema: 'scams3_root' }, {}, {});
  } catch (err) {
    console.error('Seeder error (users down):', err);
    throw err;
  }
};
