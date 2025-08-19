import path from 'path';
import fs from 'fs';
const envPath = path.resolve(__dirname, '../.env');
console.log('[DEBUG] Looking for .env at:', envPath, 'Exists:', fs.existsSync(envPath));
require('dotenv').config({ path: envPath });

import app from './app';

const PORT = process.env.PORT || 3000;

// Start server (only if not running under IIS)
if (process.env.NODE_ENV !== 'production' || !process.env.IIS_NODE_VERSION) {
  const server = app.listen(PORT, () => {
    console.log(`✅ App running on port ${PORT}`);
  });

  // Optional: Graceful shutdown
  process.on('SIGTERM', () => {
    server.close(() => {
      process.exit(0);
    });
  });
} else {
  console.log('✅ Server configured for IIS production environment - no port binding needed');
}
