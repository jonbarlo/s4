// @ts-nocheck
import 'dotenv/config';
import sql from 'mssql';

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST!,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 1433,
    options: {
        encrypt: false, // try true if your host requires it
        trustServerCertificate: true // for self-signed certs
    }
};

console.log('Testing MSSQL connection with config:', {
    ...config,
    password: config.password ? '***set***' : 'not set'
});

sql.connect(config).then((pool: any) => {
    return pool.request().query('SELECT 1 as test');
}).then((result: any) => {
    console.log('✅ MSSQL connection successful:', result.recordset);
    sql.close();
    process.exit(0);
}).catch((err: unknown) => {
    console.error('❌ MSSQL connection failed:', err);
    process.exit(1);
});
