const app = require('../src/app').default;
import request from 'supertest';

describe('Buckets API', () => {
  let token: string;

  beforeAll(async () => {
    // Login and get JWT token
    const res = await request(app)
      .post('/auth/login')
      .send({ username: 'alice', password: 'alice-password' });
    console.log('Login response:', res.body); // Debug log
    token = res.body.token;
  });

  it('should create a new bucket', async () => {
    const res = await request(app)
      .post('/buckets')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'test-bucket', targetFTPfolder: 'test-folder' });
    expect(res.status).toBe(201);
    expect(res.body.bucket).toHaveProperty('id');
    expect(res.body.bucket.name).toBe('test-bucket');
  });

  it('should list all buckets', async () => {
    const res = await request(app)
      .get('/buckets')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.buckets)).toBe(true);
  });
});
