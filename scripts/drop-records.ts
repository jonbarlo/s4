import 'dotenv/config';
import db from '../models/index';

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
