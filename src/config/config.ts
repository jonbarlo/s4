import { Dialect } from 'sequelize';

console.log('CONFIG DEBUG: process.env.DB_HOST =', process.env.DB_HOST);

export type NodeEnv = 'development' | 'test' | 'production';
export interface SequelizeConfig {
  user?: string;
  username?: string;
  password?: string;
  database?: string;
  host?: string;
  port?: number;
  dialect: Dialect;
  dialectOptions?: any;
  storage?: string;
  logging?: boolean;
  use_env_variable?: string;
}

const config: Record<NodeEnv, SequelizeConfig> = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST, // <-- add host for Sequelize
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : undefined,
    dialect: 'mssql',
    dialectOptions: {
      options: {
        server: process.env.DB_HOST, // <-- keep server for tedious
        instanceName: process.env.DB_INSTANCE || undefined,
        encrypt: true
      }
    }
  },
  test: {
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
  },
  production: {
    user: process.env.DB_USER,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : undefined,
    dialect: 'mssql',
    dialectOptions: {
      options: {
        server: process.env.DB_HOST,
        trustServerCertificate: true, // for self-signed certs (mochahost MSSQL AccessDeniedError)
        //instanceName: process.env.DB_INSTANCE || undefined,
        encrypt: true
      }
    }
  }
};

console.log('SEQUELIZE CONFIG DEBUG:', {
  ...config.development,
  password: config.development.password ? '********' : undefined
});

export default config;
