import { Sequelize } from 'sequelize';
import config from '../config/config';
import UserFactory from './user';
import BucketFactory from './bucket';
import FileFactory from './file';
import ApiKeyFactory from './apikey';

const env = process.env.NODE_ENV || 'development';
const dbConfig = (config as any)[env];

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, dbConfig);

const db: any = {};
db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.User = UserFactory(sequelize);
db.Bucket = BucketFactory(sequelize);
db.File = FileFactory(sequelize);
db.ApiKey = ApiKeyFactory(sequelize);

// Setup associations
if (db.User.associate) db.User.associate(db);
if (db.Bucket.associate) db.Bucket.associate(db);
if (db.File.associate) db.File.associate(db);
if (db.ApiKey.associate) db.ApiKey.associate(db);

export default db;
