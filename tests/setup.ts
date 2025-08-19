// Load .env.test before anything else for test isolation
require('dotenv').config({ path: '.env.test', override: true });

import initializeModels from '../src/models';
import { Umzug, SequelizeStorage } from 'umzug';
import { Sequelize } from 'sequelize';

const dialect = process.env.DB_DIALECT || 'sqlite';
let sequelize;

if (dialect === 'sqlite') {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || ':memory:',
    logging: false,
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME!,
    process.env.DB_USER!,
    process.env.DB_PASSWORD!,
    {
      host: process.env.DB_HOST!,
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 1433,
      dialect: 'mssql',
      dialectOptions: { options: { encrypt: false }, authentication: { type: 'default' } },
      logging: false,
    }
  );
}
const db = initializeModels(sequelize);

const runMigrationsAndSeeders = async () => {
  // Migrations: context is QueryInterface
  const umzugMigrations = new Umzug({
    migrations: { glob: 'src/migrations/*.ts' },
    context: db.sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize: db.sequelize }),
    logger: console,
  });
  await umzugMigrations.up();

  // Seeders: context is QueryInterface
  const umzugSeeders = new Umzug({
    migrations: { glob: 'src/seeders/*.ts' },
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