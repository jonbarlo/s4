import fs from 'fs';
import path from 'path';
import { Sequelize, DataTypes } from 'sequelize';

// Instead of initializing Sequelize here, export a function that accepts an instance
export default function initializeModels(sequelize: Sequelize) {
  const basename = path.basename(__filename);
  const db: any = {};

  // Load all .ts and .js model files except index and test files
  fs.readdirSync(__dirname)
    .filter((file) => {
      return (
        file.indexOf('.') !== 0 &&
        file !== basename &&
        (file.slice(-3) === '.ts' || file.slice(-3) === '.js') &&
        file.indexOf('.test.') === -1
      );
    })
    .forEach((file) => {
      const model = require(path.join(__dirname, file)).default(sequelize, DataTypes);
      db[model.name] = model;
    });

  Object.keys(db).forEach((modelName) => {
    if (db[modelName].associate) {
      db[modelName].associate(db);
    }
  });

  db.sequelize = sequelize;
  db.Sequelize = Sequelize;

  return db;
}
