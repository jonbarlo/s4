import 'dotenv/config';
import { Sequelize } from 'sequelize';

const connectionString = `mssql://${process.env.DB_USER}:${encodeURIComponent(process.env.DB_PASSWORD!)}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const sequelize = new Sequelize(connectionString, {
  dialect: 'mssql',
  dialectOptions: {
    options: {
      encrypt: false,
      trustServerCertificate: true
    },
    authentication: {
      type: 'default',
    },
  },
});

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
