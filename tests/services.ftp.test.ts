import * as ftp from '../src/services/ftp';

describe('FTP Service Integration', () => {
  const testFolder = '/test-folder-' + Date.now();

  it('should create and delete a folder on the FTP server', async () => {
    await expect(ftp.createFolder(testFolder)).resolves.toBeUndefined();
    await expect(ftp.deleteFolder(testFolder)).resolves.toBeUndefined();
  });

  // Add more tests for uploadFile, downloadFile, deleteFile as needed
});
