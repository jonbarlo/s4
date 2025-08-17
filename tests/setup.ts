// Load .env.test before anything else for test isolation
require('dotenv').config({ path: '.env.test', override: true });

import db from '../models';
import { Umzug, SequelizeStorage } from 'umzug';

const runMigrationsAndSeeders = async () => {
  const umzugMigrations = new Umzug({
    migrations: { glob: 'migrations/*.ts' },
    context: db.sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize: db.sequelize }),
    logger: console,
  });
  await umzugMigrations.up();

  const umzugSeeders = new Umzug({
    migrations: { glob: 'seeders/*.ts' },
    context: db.sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize: db.sequelize, modelName: 'SequelizeDataSeeder' }),
    logger: console,
  });
  await umzugSeeders.up();

  // Log all table names in SQLite
  const [tables] = await db.sequelize.query("SELECT name FROM sqlite_master WHERE type='table';");
  console.log('SQLite tables after migration/seed:', tables);

  // Fetch and log all users
  const allUsers = await db.User.findAll();
  console.log('All users in DB after seed:', allUsers.map((u: any) => u.toJSON ? u.toJSON() : u));
};

beforeAll(async () => {
  await runMigrationsAndSeeders();
});
