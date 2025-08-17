import { Dialect } from 'sequelize';
console.log('CONFIG DEBUG: process.env.DB_HOST =', process.env.DB_HOST);

export type NodeEnv = 'development' | 'test' | 'production';
export interface SequelizeConfig {
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
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    dialect: 'mssql',
    dialectOptions: {
      options: {
        encrypt: process.env.DB_ENCRYPT === 'true', // set DB_ENCRYPT=true in .env if needed
      },
      authentication: {
        type: 'default',
      },
    },
  },
  test: {
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    dialect: 'mssql',
    dialectOptions: {
      options: {
        server: process.env.DB_HOST,
        instanceName: process.env.DB_INSTANCE || undefined,
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
