import 'dotenv/config';
import { Sequelize } from 'sequelize';
import config from '../config/config';

const env = process.env.NODE_ENV || 'development';
const envConfig = (config as any)[env];

let sequelize: Sequelize;
if (envConfig.use_env_variable) {
  sequelize = new Sequelize(process.env[envConfig.use_env_variable] as string, envConfig);
} else {
  sequelize = new Sequelize(envConfig.database, envConfig.username, envConfig.password, envConfig);
}

(async () => {
  try {
    await sequelize.authenticate();
    console.log('DB connection successful!');
    process.exit(0);
  } catch (err) {
    console.error('DB connection failed:', err);
    process.exit(1);
  }
})();
