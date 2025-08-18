import 'dotenv/config';
import db from '../models';

(async () => {
  try {
    await db.File.destroy({ where: {}, truncate: true });
    await db.Bucket.destroy({ where: {}, truncate: true });
    await db.User.destroy({ where: {}, truncate: true });
    console.log('All records deleted from all tables.');
    process.exit(0);
  } catch (err) {
    console.error('Error clearing records:', err);
    process.exit(1);
  }
})();
