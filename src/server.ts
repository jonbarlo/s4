import path from 'path';
import fs from 'fs';
const envPath = path.resolve(__dirname, '../.env');
console.log('[DEBUG] Looking for .env at:', envPath, 'Exists:', fs.existsSync(envPath));
require('dotenv').config({ path: envPath });

import app from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`[DEBUG] Main app (minimal baseline) server running on port ${PORT}`);
});
