console.log('CONFIG DEBUG: process.env.DB_HOST =', process.env.DB_HOST);
const config = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST, // <-- add host for Sequelize
    port: process.env.DB_PORT,
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
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME + '_test',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mssql',
    dialectOptions: {
      options: {
        server: process.env.DB_HOST,
        instanceName: process.env.DB_INSTANCE || undefined,
        encrypt: true
      }
    }
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
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

export default config;
