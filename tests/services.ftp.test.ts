import * as ftp from '../src/services/ftp';
import request from 'supertest';
import app from '../src/app';

describe('FTP Service Integration', () => {
  const testFolder = '/test-folder-' + Date.now();

  it('should create and delete a folder on the FTP server', async () => {
    await expect(ftp.createFolder(testFolder)).resolves.toBeUndefined();
    await expect(ftp.deleteFolder(testFolder)).resolves.toBeUndefined();
  });
});

describe('Buckets API Integration', () => {
  const testBucketName = 'jest-bucket-' + Date.now();
  const testFTPFolder = '/jest-bucket-' + Date.now();
  let token: string;

  beforeAll(async () => {
    // Login as a test user to get a JWT token (assume test user exists)
    const res = await request(app)
      .post('/auth/login')
      .send({ username: 'alice', password: 'alice-password' });
    token = res.body.token;
  });

  it('should create a bucket (DB + FTP)', async () => {
    const res = await request(app)
      .post('/buckets')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: testBucketName, targetFTPfolder: testFTPFolder });
    expect(res.status).toBe(201);
    expect(res.body.bucket).toBeDefined();
    expect(res.body.bucket.name).toBe(testBucketName);
    expect(res.body.bucket.targetFTPfolder).toBe(testFTPFolder);
    // Check FTP folder exists (try to create again, should not throw)
    await expect(ftp.createFolder(testFTPFolder)).resolves.toBeUndefined();
  });

  afterAll(async () => {
    // Clean up FTP folder
    await ftp.deleteFolder(testFTPFolder);
  });
});

describe('Files API Integration', () => {
  const testBucketName = 'jest-bucket-file-' + Date.now();
  const testFTPFolder = '/jest-bucket-file-' + Date.now();
  const testFileName = 'test-upload.txt';
  const testFileContent = 'Hello, FTP!';
  let token: string;
  let bucketId: number;

  beforeAll(async () => {
    // Login as a test user to get a JWT token
    const res = await request(app)
      .post('/auth/login')
      .send({ username: 'alice', password: 'alice-password' });
    token = res.body.token;
    // Create a bucket for the file
    const bucketRes = await request(app)
      .post('/buckets')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: testBucketName, targetFTPfolder: testFTPFolder });
    bucketId = bucketRes.body.bucket.id;
    // Write a temp file to upload
    require('fs').writeFileSync(testFileName, testFileContent);
  });

  it('should upload a file (API + FTP + DB)', async () => {
    const res = await request(app)
      .post('/files')
      .set('Authorization', `Bearer ${token}`)
      .field('bucketId', bucketId)
      .field('targetFTPfolder', testFTPFolder)
      .attach('file', testFileName);
    if (res.status !== 201) {
      console.error('File upload error:', res.body);
    }
    expect(res.status).toBe(201);
    expect(res.body.file).toBeDefined();
    expect(res.body.file.filename).toBe(testFileName);
    expect(res.body.file.bucketId).toBe(bucketId);
  });

  afterAll(async () => {
    // Clean up FTP folder and local file
    await ftp.deleteFolder(testFTPFolder);
    require('fs').unlinkSync(testFileName);
  });
});
