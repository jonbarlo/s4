import 'dotenv/config';
import { Sequelize } from 'sequelize';
import initializeModels from '../models';

const sequelize = new Sequelize(
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
const db = initializeModels(sequelize);

(async () => {
  try {
    await db.File.destroy({ where: {}, truncate: true });
    await db.Bucket.destroy({ where: {}, truncate: true });
    await db.User.destroy({ where: {}, truncate: true });
    console.log('All records deleted from all tables.');
    process.exit(0);
  } catch (err) {
    console.error('Error clearing records:', err);
    process.exit(1);
  }
})();
