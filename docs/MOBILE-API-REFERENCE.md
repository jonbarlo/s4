# Mobile API Reference - S4 Bucket API

## Overview
Complete API reference for building mobile applications that integrate with the S4 Bucket API - an S3-like storage service backed by FTP storage.

**Base URLs:**
- **Development**: `http://localhost:3000`
- **Production**: `https://api.s4.506software.com`

**Interactive API Docs**: `/api-docs` (Swagger UI)

---

## Authentication

### JWT Token System
- **Type**: Bearer token authentication
- **Expiration**: 1 hour (3600 seconds)
- **Header**: `Authorization: Bearer <token>`
- **Storage**: Store securely in mobile app keychain/secure storage

### Authentication Flow
1. **Login** → Get JWT token
2. **Store token** securely in mobile app
3. **Include token** in all subsequent requests
4. **Handle expiration** - redirect to login when token expires

---

## Data Models

### User Model
```json
{
  "id": 1,
  "username": "alice",
  "password": "hashed_password",
  "apiKey": "58ce4d245955abb1886599eedd9f57c090a0a54441d410c5e6763882648ce296",
  "permissions": "FULL_CONTROL",
  "createdAt": "2025-08-18T04:23:43.168Z",
  "updatedAt": "2025-08-18T04:23:59.409Z"
}
```

### Bucket Model
```json
{
  "id": 1,
  "name": "my-bucket",
  "targetFTPfolder": "/uploads/my-bucket",
  "userId": 1,
  "createdAt": "2025-08-18T19:57:27.000Z",
  "updatedAt": "2025-08-18T19:57:27.000Z"
}
```

### File Model
```json
{
  "id": 1,
  "filename": "document.pdf",
  "size": 1024000,
  "bucketId": 1,
  "userId": 1,
  "targetFTPfolder": "/uploads/my-bucket/documents",
  "uploadedAt": "2025-08-18T19:57:27.000Z"
}
```

---

## API Endpoints

### 1. Authentication

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "username": "alice",
  "password": "alice-password"
}
```

**Response (200):**
```json
{
  "status": "ok",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400` - Missing username/password
- `401` - Invalid credentials
- `500` - Server error

---

### 2. Bucket Management

#### Create Bucket
```http
POST /buckets
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "my-bucket",
  "targetFTPfolder": "/uploads/my-bucket"
}
```

**Response (201):**
```json
{
  "bucket": {
    "id": 1,
    "name": "my-bucket",
    "targetFTPfolder": "/uploads/my-bucket",
    "userId": 1
  }
}
```

**Mobile Implementation Notes:**
- Validate bucket name (no special characters)
- Suggest FTP folder path based on bucket name
- Handle duplicate bucket names gracefully

#### List Buckets
```http
GET /buckets
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "buckets": [
    {
      "id": 1,
      "name": "my-bucket",
      "targetFTPfolder": "/uploads/my-bucket",
      "userId": 1,
      "createdAt": "2025-08-18T19:57:27.000Z",
      "updatedAt": "2025-08-18T19:57:27.000Z"
    }
  ]
}
```

---

### 3. File Operations

#### Upload File
```http
POST /files
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <binary_file>
bucketId: 1
targetFTPfolder: documents (optional)
```

**Mobile Implementation Notes:**
- Use multipart/form-data for file uploads
- Show upload progress (use chunked upload for large files)
- Validate file size and type on client side
- Handle network interruptions gracefully

**Response (201):**
```json
{
  "file": {
    "id": 1,
    "filename": "document.pdf",
    "size": 1024000,
    "bucketId": 1,
    "userId": 1,
    "targetFTPfolder": "/uploads/my-bucket/documents",
    "uploadedAt": "2025-08-18T19:57:27.000Z"
  }
}
```

#### List Files
```http
GET /files
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "files": [
    {
      "id": 1,
      "filename": "document.pdf",
      "size": 1024000,
      "bucketId": 1,
      "userId": 1,
      "targetFTPfolder": "/uploads/my-bucket/documents",
      "uploadedAt": "2025-08-18T19:57:27.000Z"
    }
  ]
}
```

**Mobile Implementation Notes:**
- Implement pagination for large file lists
- Cache file metadata locally
- Show file icons based on type
- Group files by bucket or folder

#### Download File
```http
GET /files/{id}/download
Authorization: Bearer <token>
```

**Response (200):**
- Binary file stream
- Content-Type: application/octet-stream
- Content-Disposition: attachment; filename="document.pdf"

**Mobile Implementation Notes:**
- Show download progress
- Handle large file downloads (stream to local storage)
- Resume interrupted downloads
- Cache downloaded files locally

#### Delete File
```http
DELETE /files/{id}
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "status": "ok",
  "message": "File deleted"
}
```

---

### 4. Folder Management

#### Create Folder
```http
POST /folders
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "documents",
  "bucketId": 1
}
```

**Response (201):**
```json
{
  "folder": {
    "name": "documents",
    "bucketId": 1,
    "userId": 1
  }
}
```

#### List Folders
```http
GET /folders
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "folders": [
    {
      "targetFTPfolder": "/uploads/my-bucket/documents"
    }
  ]
}
```

---

### 5. System Endpoints

#### Health Check
```http
GET /health
```

**Response (200):**
```json
{
  "status": "ok",
  "message": "Health check passed",
  "dbTest": [{"result": 2}]
}
```

#### Root Endpoint
```http
GET /
```

**Response (200):**
```
ok
```

---

## Core Logic & Business Rules

### File Storage Architecture
1. **FTP Integration**: All files stored on remote FTP server
2. **Database Metadata**: File information stored in MSSQL database
3. **Bucket Organization**: Files organized by buckets (FTP directories)
4. **User Isolation**: Each user sees only their own files/buckets

### File Upload Process
1. **Client Validation**: Check file size, type, name
2. **FTP Folder Creation**: Ensure target folder exists
3. **File Upload**: Upload to FTP server
4. **Database Record**: Create metadata record
5. **Rollback**: Clean up FTP if database fails

### File Download Process
1. **Authentication Check**: Verify JWT token
2. **File Lookup**: Find file in database
3. **FTP Retrieval**: Download from FTP server
4. **Stream Response**: Return file to client

### Security Model
- **JWT Authentication**: All endpoints require valid token
- **User Isolation**: Users can only access their own resources
- **Input Validation**: Server-side validation of all inputs
- **Rate Limiting**: Production only (disabled in development)

---

## Mobile App Integration Patterns

### 1. Authentication Flow
```swift
// iOS Swift Example
class AuthManager {
    static let shared = AuthManager()
    private var authToken: String?
    
    func login(username: String, password: String) async throws -> Bool {
        let url = URL(string: "\(baseURL)/auth/login")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body = ["username": username, "password": password]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 {
            let result = try JSONDecoder().decode(LoginResponse.self, from: data)
            authToken = result.token
            // Store in Keychain
            return true
        }
        return false
    }
    
    func getAuthHeaders() -> [String: String] {
        guard let token = authToken else { return [:] }
        return ["Authorization": "Bearer \(token)"]
    }
}
```

### 2. File Upload with Progress
```swift
// iOS Swift Example
class FileUploader {
    func uploadFile(fileURL: URL, bucketId: Int, folder: String?) async throws -> FileModel {
        let url = URL(string: "\(baseURL)/files")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(AuthManager.shared.authToken ?? "")", forHTTPHeaderField: "Authorization")
        
        let boundary = UUID().uuidString
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        
        var body = Data()
        
        // Add file
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"file\"; filename=\"\(fileURL.lastPathComponent)\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: application/octet-stream\r\n\r\n".data(using: .utf8)!)
        body.append(try Data(contentsOf: fileURL))
        body.append("\r\n".data(using: .utf8)!)
        
        // Add bucketId
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"bucketId\"\r\n\r\n".data(using: .utf8)!)
        body.append("\(bucketId)\r\n".data(using: .utf8)!)
        
        // Add optional folder
        if let folder = folder {
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"targetFTPfolder\"\r\n\r\n".data(using: .utf8)!)
            body.append("\(folder)\r\n".data(using: .utf8)!)
        }
        
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)
        request.httpBody = body
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 201 {
            let result = try JSONDecoder().decode(FileUploadResponse.self, from: data)
            return result.file
        }
        
        throw APIError.uploadFailed
    }
}
```

### 3. File Download with Progress
```swift
// iOS Swift Example
class FileDownloader {
    func downloadFile(fileId: Int, filename: String) async throws -> URL {
        let url = URL(string: "\(baseURL)/files/\(fileId)/download")!
        var request = URLRequest(url: url)
        request.setValue("Bearer \(AuthManager.shared.authToken ?? "")", forHTTPHeaderField: "Authorization")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 {
            let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            let fileURL = documentsPath.appendingPathComponent(filename)
            try data.write(to: fileURL)
            return fileURL
        }
        
        throw APIError.downloadFailed
    }
}
```

---

## Error Handling

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `404` - Not Found
- `500` - Internal Server Error

### Error Response Format
```json
{
  "status": "error",
  "message": "Human readable error message",
  "details": "Technical details (optional)"
}
```

### Common Error Scenarios
1. **Token Expired**: Redirect to login
2. **Network Error**: Show retry option
3. **File Too Large**: Validate before upload
4. **Storage Full**: Check available space
5. **Permission Denied**: Verify user access

---

## Best Practices for Mobile Apps

### 1. Authentication
- Store JWT tokens securely (Keychain on iOS, Keystore on Android)
- Implement automatic token refresh
- Handle token expiration gracefully
- Logout user on security violations

### 2. File Management
- Implement offline caching for file metadata
- Show upload/download progress
- Handle network interruptions
- Validate files before upload
- Implement retry logic for failed operations

### 3. Performance
- Use pagination for large lists
- Implement lazy loading for file thumbnails
- Cache frequently accessed data
- Compress images before upload
- Use background uploads for large files

### 4. User Experience
- Show loading states during operations
- Provide clear error messages
- Implement pull-to-refresh
- Support offline mode where possible
- Use native file pickers

---

## Testing

### Test Credentials
```json
{
  "username": "alice",
  "password": "alice-password"
}
```

### Test Endpoints
1. **Health Check**: `GET /health`
2. **Login**: `POST /auth/login`
3. **Create Bucket**: `POST /buckets`
4. **Upload File**: `POST /files`
5. **Download File**: `GET /files/{id}/download`

### Testing Tools
- **Swagger UI**: `/api-docs`
- **Postman**: Import API collection
- **curl**: Command line testing
- **Mobile Simulators**: Test on device/simulator

---

## Support & Resources

- **API Documentation**: `/api-docs`
- **Backend Repository**: Check main README.md
- **Issue Tracking**: Project issue tracker
- **Development Team**: Backend team contact

---

This document contains everything needed to build a mobile app that integrates with the S4 Bucket API. Use the examples and patterns provided to implement secure, efficient file storage functionality in your mobile application.
