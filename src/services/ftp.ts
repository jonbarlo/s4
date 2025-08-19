import { Client } from 'basic-ftp';

const {
  SUDO_FTP_HOST,
  SUDO_FTP_PORT,
  SUDO_FTP_USER,
  SUDO_FTP_PASS,
} = process.env;

function getFtpClient() {
  const client = new Client();
  return client;
}

async function debugConnect(client: Client) {
  console.log('[FTP DEBUG]', {
    host: SUDO_FTP_HOST,
    port: SUDO_FTP_PORT,
    user: SUDO_FTP_USER,
  });
  await client.access({
    host: SUDO_FTP_HOST!,
    port: SUDO_FTP_PORT ? parseInt(SUDO_FTP_PORT) : 21,
    user: SUDO_FTP_USER!,
    password: SUDO_FTP_PASS!,
    secure: false,
  });
}

export async function createFolder(path: string) {
  const client = getFtpClient();
  try {
    await debugConnect(client);
    await client.ensureDir(path);
  } finally {
    client.close();
  }
}

export async function deleteFolder(path: string) {
  const client = getFtpClient();
  try {
    await debugConnect(client);
    await client.removeDir(path);
  } finally {
    client.close();
  }
}

export async function uploadFile(remotePath: string, localPath: string) {
  const client = getFtpClient();
  try {
    await debugConnect(client);
    await client.uploadFrom(localPath, remotePath);
  } finally {
    client.close();
  }
}

export async function downloadFile(remotePath: string, localPath: string) {
  const client = getFtpClient();
  try {
    await debugConnect(client);
    await client.downloadTo(localPath, remotePath);
  } finally {
    client.close();
  }
}

export async function deleteFile(remotePath: string) {
  const client = getFtpClient();
  try {
    await debugConnect(client);
    await client.remove(remotePath);
  } finally {
    client.close();
  }
}
