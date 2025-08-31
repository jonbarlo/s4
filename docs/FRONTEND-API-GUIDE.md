# Frontend API Guide - S4 Bucket API

## Overview
This document provides everything needed for ReactJS developers to integrate with the S4 Bucket API - an S3-like storage service backed by FTP.

**Base URLs:**
- **Development**: `http://localhost:3000`
- **Production**: `https://api.s4.506software.com`

**Interactive API Docs**: `/api-docs` (Swagger UI)

---

## Authentication

### JWT Token Flow
1. **Login** → Get JWT token
2. **Include token** in all subsequent requests
3. **Token expires** after 1 hour

### Headers Required
```javascript
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${jwtToken}`
};
```

---

## API Endpoints

### 1. Authentication

#### Login
```javascript
// POST /auth/login
const login = async (username, password) => {
  const response = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  
  if (response.ok) {
    const { token } = await response.json();
    localStorage.setItem('jwt_token', token);
    return token;
  }
  throw new Error('Login failed');
};
```

**Response:**
```json
{
  "status": "ok",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 2. Buckets

#### Create Bucket
```javascript
// POST /buckets
const createBucket = async (name, targetFTPfolder) => {
  const response = await fetch('/buckets', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ name, targetFTPfolder })
  });
  
  if (response.ok) {
    return await response.json();
  }
  throw new Error('Failed to create bucket');
};
```

**Request Body:**
```json
{
  "name": "my-bucket",
  "targetFTPfolder": "/uploads/my-bucket"
}
```

#### List Buckets
```javascript
// GET /buckets
const listBuckets = async () => {
  const response = await fetch('/buckets', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (response.ok) {
    const { buckets } = await response.json();
    return buckets;
  }
  throw new Error('Failed to fetch buckets');
};
```

---

### 3. Files

#### Upload File
```javascript
// POST /files
const uploadFile = async (file, bucketId, targetFTPfolder = null) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('bucketId', bucketId);
  if (targetFTPfolder) {
    formData.append('targetFTPfolder', targetFTPfolder);
  }
  
  const response = await fetch('/files', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  
  if (response.ok) {
    return await response.json();
  }
  throw new Error('Failed to upload file');
};
```

**Usage:**
```javascript
const fileInput = document.getElementById('fileInput');
const file = fileInput.files[0];
await uploadFile(file, 1, 'documents');
```

#### List Files
```javascript
// GET /files
const listFiles = async () => {
  const response = await fetch('/files', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (response.ok) {
    const { files } = await response.json();
    return files;
  }
  throw new Error('Failed to fetch files');
};
```

#### Download File
```javascript
// GET /files/{id}/download
const downloadFile = async (fileId, filename) => {
  const response = await fetch(`/files/${fileId}/download`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (response.ok) {
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  } else {
    throw new Error('Failed to download file');
  }
};
```

#### Delete File
```javascript
// DELETE /files/{id}
const deleteFile = async (fileId) => {
  const response = await fetch(`/files/${fileId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (response.ok) {
    return await response.json();
  }
  throw new Error('Failed to delete file');
};
```

---

### 4. Folders

#### Create Folder
```javascript
// POST /folders
const createFolder = async (name, bucketId) => {
  const response = await fetch('/folders', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ name, bucketId })
  });
  
  if (response.ok) {
    return await response.json();
  }
  throw new Error('Failed to create folder');
};
```

#### List Folders
```javascript
// GET /folders
const listFolders = async () => {
  const response = await fetch('/folders', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (response.ok) {
    const { folders } = await response.json();
    return folders;
  }
  throw new Error('Failed to fetch folders');
};
```

---

## React Integration Patterns

### 1. Authentication Context
```javascript
// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('jwt_token'));
  const [user, setUser] = useState(null);

  const login = async (username, password) => {
    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      if (response.ok) {
        const { token } = await response.json();
        localStorage.setItem('jwt_token', token);
        setToken(token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('jwt_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

### 2. API Service Layer
```javascript
// src/services/api.js
class ApiService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
  }

  getHeaders() {
    const token = localStorage.getItem('jwt_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  }

  // Bucket methods
  async createBucket(name, targetFTPfolder) {
    return this.request('/buckets', {
      method: 'POST',
      body: JSON.stringify({ name, targetFTPfolder })
    });
  }

  async listBuckets() {
    return this.request('/buckets');
  }

  // File methods
  async uploadFile(file, bucketId, targetFTPfolder) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucketId', bucketId);
    if (targetFTPfolder) {
      formData.append('targetFTPfolder', targetFTPfolder);
    }

    return this.request('/files', {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      body: formData
    });
  }

  async listFiles() {
    return this.request('/files');
  }

  async deleteFile(fileId) {
    return this.request(`/files/${fileId}`, {
      method: 'DELETE'
    });
  }

  async downloadFile(fileId) {
    const token = localStorage.getItem('jwt_token');
    const response = await fetch(`${this.baseURL}/files/${fileId}/download`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      throw new Error('Download failed');
    }
    
    return response.blob();
  }
}

export default new ApiService();
```

### 3. React Hooks
```javascript
// src/hooks/useApi.js
import { useState, useCallback } from 'react';
import apiService from '../services/api';

export const useBuckets = () => {
  const [buckets, setBuckets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBuckets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { buckets } = await apiService.listBuckets();
      setBuckets(buckets);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createBucket = useCallback(async (name, targetFTPfolder) => {
    try {
      await apiService.createBucket(name, targetFTPfolder);
      await fetchBuckets(); // Refresh list
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [fetchBuckets]);

  return { buckets, loading, error, fetchBuckets, createBucket };
};

export const useFiles = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { files } = await apiService.listFiles();
      setFiles(files);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadFile = useCallback(async (file, bucketId, targetFTPfolder) => {
    try {
      await apiService.uploadFile(file, bucketId, targetFTPfolder);
      await fetchFiles(); // Refresh list
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [fetchFiles]);

  const deleteFile = useCallback(async (fileId) => {
    try {
      await apiService.deleteFile(fileId);
      await fetchFiles(); // Refresh list
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [fetchFiles]);

  return { files, loading, error, fetchFiles, uploadFile, deleteFile };
};
```

### 4. Component Examples

#### File Upload Component
```javascript
// src/components/FileUpload.js
import React, { useState } from 'react';
import { useFiles } from '../hooks/useApi';

const FileUpload = ({ bucketId, targetFTPfolder }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const { uploadFile } = useFiles();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    try {
      await uploadFile(file, bucketId, targetFTPfolder);
      setFile(null);
      // Reset file input
      document.getElementById('fileInput').value = '';
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        id="fileInput"
        type="file"
        onChange={handleFileChange}
        disabled={uploading}
      />
      <button 
        onClick={handleUpload}
        disabled={!file || uploading}
      >
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
    </div>
  );
};

export default FileUpload;
```

#### File List Component
```javascript
// src/components/FileList.js
import React, { useEffect } from 'react';
import { useFiles } from '../hooks/useApi';

const FileList = () => {
  const { files, loading, error, fetchFiles, deleteFile } = useFiles();

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleDelete = async (fileId) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        await deleteFile(fileId);
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
  };

  const handleDownload = async (fileId, filename) => {
    try {
      const blob = await apiService.downloadFile(fileId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  if (loading) return <div>Loading files...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h3>Files</h3>
      {files.length === 0 ? (
        <p>No files found</p>
      ) : (
        <ul>
          {files.map(file => (
            <li key={file.id}>
              {file.filename} ({file.size} bytes)
              <button onClick={() => handleDownload(file.id, file.filename)}>
                Download
              </button>
              <button onClick={() => handleDelete(file.id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FileList;
```

---

## Environment Setup

### 1. Create `.env` file
```bash
REACT_APP_API_URL=http://localhost:3000
```

### 2. Install dependencies
```bash
npm install react-router-dom axios
```

### 3. App.js setup
```javascript
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* Your app components */}
      </AuthProvider>
    </BrowserRouter>
  );
}
```

---

## Error Handling

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (missing fields)
- `401` - Unauthorized (invalid/missing token)
- `404` - Not Found
- `500` - Internal Server Error

### Error Response Format
```json
{
  "status": "error",
  "message": "Human readable error message"
}
```

---

## Testing the API

### 1. Use the Swagger UI
Visit `/api-docs` to test endpoints interactively

### 2. Test with curl
```bash
# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"alice-password"}'

# Use token
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/buckets
```

---

## Best Practices

1. **Always handle errors** - Check response.ok before processing
2. **Store JWT securely** - Use localStorage for development, httpOnly cookies for production
3. **Refresh token** - Implement token refresh logic before expiration
4. **Loading states** - Show loading indicators during API calls
5. **Optimistic updates** - Update UI immediately, rollback on error
6. **File validation** - Check file size, type, and name on frontend
7. **Retry logic** - Implement retry for failed uploads/downloads

---

## Support

- **API Documentation**: `/api-docs`
- **Backend Team**: Check the main README.md
- **Issues**: Check the project's issue tracker

This guide contains everything needed to build a React frontend for the S4 Bucket API!
