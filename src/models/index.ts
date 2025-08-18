import fs from 'fs';
import path from 'path';
import { Sequelize, DataTypes } from 'sequelize';
import config, { NodeEnv } from '../config/config';

const basename = path.basename(__filename);
const env = (process.env.NODE_ENV as NodeEnv) || 'development';
const envConfig = config[env];
const db: any = {};

let sequelize: Sequelize;
if (envConfig.dialect === 'sqlite') {
  sequelize = new Sequelize(envConfig);
} else if (envConfig.use_env_variable) {
  sequelize = new Sequelize(process.env[envConfig.use_env_variable] as string, envConfig);
} else {
  sequelize = new Sequelize(envConfig.database!, envConfig.username!, envConfig.password!, envConfig);
}

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

// Debug log: print all loaded model names
console.log('Loaded models:', Object.keys(db));

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
