import 'dotenv/config';
import db from '../models';

console.log('DEBUG: Sequelize config:', db.sequelize.config);

(async () => {
  try {
    const qi = db.sequelize.getQueryInterface();
    console.log('DEBUG: Fetching tables before drop...');
    const before = await qi.showAllTables();
    console.log('Tables before drop:', before);

    // Drop all foreign key constraints
    const constraints = await db.sequelize.query(`
      SELECT 
        fk.name AS FK_Name, 
        tp.name AS ParentTable
      FROM sys.foreign_keys AS fk
      INNER JOIN sys.tables AS tp ON fk.parent_object_id = tp.object_id
    `, { type: db.sequelize.QueryTypes.SELECT });

    for (const fk of constraints as any[]) {
      console.log(`Dropping FK: ${fk.FK_Name} on table: ${fk.ParentTable}`);
      await db.sequelize.query(`ALTER TABLE [${fk.ParentTable}] DROP CONSTRAINT [${fk.FK_Name}]`);
    }

    for (const table of before) {
      const tableName = typeof table === 'string' ? table : table.tableName;
      console.log(`Dropping table: ${tableName}`);
      await qi.dropTable(tableName);
    }

    console.log('All tables dropped (force).');
    const after = await qi.showAllTables();
    console.log('Tables after drop:', after);

    process.exit(0);
  } catch (err) {
    console.error('Error dropping tables. Check your DB connection and credentials:', err);
    process.exit(1);
  }
})();
