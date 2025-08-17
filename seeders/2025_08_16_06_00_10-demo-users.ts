import { QueryInterface } from 'sequelize';
import bcrypt from 'bcrypt';

export const up = async ({ context }: { context: QueryInterface }) => {
  const alicePlain = 'alice-password';
  const bobPlain = 'bob-password';
  const aliceHash = await bcrypt.hash(alicePlain, 10);
  const bobHash = await bcrypt.hash(bobPlain, 10);
  await context.bulkInsert('Users', [
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
  ], {});
  console.log('Seeded users:');
  console.log('alice | password:', alicePlain, '| apiKey: alice-key | permissions: FULL_CONTROL');
  console.log('bob   | password:', bobPlain, '| apiKey: bob-key | permissions: READ');
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await context.bulkDelete('Users', {}, {});
};
