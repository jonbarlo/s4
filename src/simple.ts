import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Simple API is working' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Health check passed' });
});

app.listen(PORT, () => {
  console.log(`[DEBUG] Simple API server running on port ${PORT}`);
});
