import fs from 'fs';
import path from 'path';
import { Sequelize, DataTypes } from 'sequelize';
import process from 'process';
import config from '../config/config';

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const envConfig = (config as any)[env];
const db: any = {};

let sequelize: Sequelize;
if (envConfig.use_env_variable) {
  sequelize = new Sequelize(process.env[envConfig.use_env_variable] as string, envConfig);
} else {
  sequelize = new Sequelize(envConfig.database, envConfig.username, envConfig.password, envConfig);
}

fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' && // Only load .js files in dist/
      file.indexOf('.test.') === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file)).default(sequelize, DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
