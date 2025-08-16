# MVP Description: S3-like Storage API using FTP

## Overview
This MVP is a NodeJS-based REST API that mimics the core functionality of AWS S3 buckets, but uses an FTP server as the underlying storage mechanism. The system is designed for deployment on a shared IIS server, making it suitable for environments with limited infrastructure flexibility.

## Core Features
- **File Upload**: Clients can upload files via the API, which are then stored on the FTP server.
- **File Download**: Files can be retrieved from the FTP server through the API.
- **List Files**: List all files in a given "bucket" (FTP directory).
- **Delete Files**: Remove files from the FTP server via the API.
- **Basic Authentication**: Simple API key or token-based authentication for access control.
- **Metadata Handling**: Store and retrieve basic metadata for files (e.g., upload date, size).
- **Bucket Management**: Create and list logical buckets (FTP directories) for file organization.

## Architecture

![MVP Architecture Diagram](./mvp-architecture.svg)

[View SVG directly](./mvp-architecture.svg)

## API Endpoints

### Authentication
All endpoints require an `Authorization: Bearer <API_KEY>` header.

---

### 1. Create Bucket
- **Address:** `POST /buckets`
- **Payload:**
  ```json
  {
    "bucketName": "my-bucket"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "bucket": "my-bucket"
  }
  ```

---

### 2. List Buckets
- **Address:** `GET /buckets`
- **Response:**
  ```json
  {
    "buckets": ["my-bucket", "another-bucket"]
  }
  ```

---

### 3. Upload File
- **Address:** `POST /buckets/{bucketName}/files`
- **Payload:** `multipart/form-data` with file field named `file`
- **Response:**
  ```json
  {
    "success": true,
    "file": {
      "filename": "example.txt",
      "size": 12345,
      "uploadedAt": "2024-06-01T12:00:00Z"
    }
  }
  ```

---

### 4. List Files in Bucket
- **Address:** `GET /buckets/{bucketName}/files`
- **Response:**
  ```json
  {
    "files": [
      {
        "filename": "example.txt",
        "size": 12345,
        "uploadedAt": "2024-06-01T12:00:00Z"
      }
    ]
  }
  ```

---

### 5. Download File
- **Address:** `GET /buckets/{bucketName}/files/{filename}`
- **Response:**
  - Returns the file as a binary stream with appropriate `Content-Type` and `Content-Disposition` headers.

---

### 6. Delete File
- **Address:** `DELETE /buckets/{bucketName}/files/{filename}`
- **Response:**
  ```json
  {
    "success": true,
    "deleted": "example.txt"
  }
  ```

---

## Deployment Notes
- **Platform**: NodeJS application hosted on a shared IIS server (using iisnode or similar module).
- **FTP Server**: Can be any accessible FTP server (local or remote) with credentials managed securely.
- **Environment Variables**: Store FTP credentials, API keys, and configuration in environment variables or IIS application settings.
- **Limitations**: Performance and scalability are limited by FTP protocol and shared hosting constraints. Not suitable for high-throughput or large-scale production use.

## Use Cases
- Simple file storage for web/mobile apps where S3 is not available or overkill.
- Legacy environments requiring FTP integration.
- Prototyping S3-like APIs without cloud vendor lock-in.

---

*This MVP is intended as a proof-of-concept and is not recommended for production workloads requiring high security, reliability, or scalability.*

---

## Recommended Project Structure (Enterprise Node.js API)

```
scams3/
├── src/
│   ├── api/                # Route definitions and controllers
│   │   ├── buckets/        # Bucket-related endpoints
│   │   └── files/          # File-related endpoints
│   ├── services/           # Business logic and FTP integration
│   ├── models/             # Data models and validation schemas
│   ├── middlewares/        # Express middlewares (auth, error handling, etc.)
│   ├── utils/              # Utility/helper functions
│   ├── config/             # Configuration (env, FTP, etc.)
│   ├── types/              # TypeScript type definitions
│   └── app.ts              # Express app entry point
├── tests/                  # Unit and integration tests
├── public/                 # Static files (if needed)
├── scripts/                # Automation and setup scripts
├── docs/                   # Documentation (architecture, API, etc.)
├── .env                    # Environment variables (never commit secrets)
├── .gitignore              # Git ignore rules
├── package.json            # NPM dependencies and scripts
├── tsconfig.json           # TypeScript configuration
└── README.md               # Project overview
```

**Notes:**
- Each folder should contain an `index.ts` for re-exports if needed.
- Keep controllers thin; put business logic in services.
- Use environment variables for sensitive config.
- Organize tests to mirror the `src/` structure for clarity.
- Follow best practices for error handling, validation, and security.
