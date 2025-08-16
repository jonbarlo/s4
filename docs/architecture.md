flowchart TD
  Client["Client Application"] -->|"REST API Calls"| API["NodeJS API (S3-like)"]
  API -->|"FTP Protocol"| FTP["FTP Server (File Storage)"]
  API -->|"IIS Hosting"| IIS["IIS Shared Server"]
  API -->|"Authentication, File Management, Metadata"| API
  FTP -->|"Stores Files"| FTP
