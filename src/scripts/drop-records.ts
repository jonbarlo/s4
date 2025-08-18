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
    const qi = db.sequelize.getQueryInterface();
    console.log('DEBUG: Fetching tables before record deletion...');
    const tables = await qi.showAllTables();
    console.log('Tables:', tables);

    for (const table of tables) {
      const tableName = typeof table === 'string' ? table : table.tableName;
      console.log(`Deleting all records from: ${tableName}`);
      await db.sequelize.query(`DELETE FROM [${tableName}]`);
    }

    console.log('All records deleted from all tables (force).');
    process.exit(0);
  } catch (err) {
    console.error('Error clearing records:', err);
    process.exit(1);
  }
})();
