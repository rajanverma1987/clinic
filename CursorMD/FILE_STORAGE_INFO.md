# File Storage Information

## Current Implementation

### Where Files Are Stored
**Location**: MongoDB database in the `TelemedicineSession` collection

**Storage Method**: 
- Files are stored as **base64-encoded strings** in the `sharedFiles` array
- Each file entry includes:
  - `fileName`: Original file name
  - `fileType`: MIME type
  - `fileSize`: File size in bytes
  - `encryptedData`: Base64-encoded encrypted file content
  - `iv`: Initialization Vector for decryption (if encrypted)
  - `encrypted`: Boolean flag indicating encryption status
  - `uploadedBy`: User ID who uploaded the file
  - `uploadedAt`: Upload timestamp

### Storage Schema
```javascript
sharedFiles: [{
  fileName: String,
  fileType: String,
  fileSize: Number,
  encryptedData: String, // Base64-encoded encrypted file
  iv: String, // IV for decryption
  encrypted: Boolean,
  uploadedBy: ObjectId,
  uploadedAt: Date
}]
```

### Current Limitations

1. **MongoDB Document Size Limit**: 16MB per document
   - This limits total file storage per session
   - Large files may cause issues

2. **Performance**: 
   - Base64 encoding increases size by ~33%
   - Loading all files in session query can be slow
   - Not ideal for large files or many files

3. **Memory Usage**:
   - Entire file loaded into memory when querying session
   - Can cause memory issues with large files

### File Access

**Upload Endpoint**: `POST /api/telemedicine/sessions/[id]/files`
- Accepts encrypted file data as base64 string
- Stores in MongoDB `sharedFiles` array

**Download Endpoint**: `GET /api/telemedicine/sessions/[id]/files/[fileId]`
- Retrieves file from MongoDB
- Returns encrypted data for client-side decryption

**List Files**: `GET /api/telemedicine/sessions/[id]/files`
- Returns all files in session's `sharedFiles` array

## Recommended Improvements

### Option 1: File System Storage (Simple)
Store files on server filesystem:
- Path: `uploads/telemedicine/{sessionId}/{fileId}`
- Store file path in MongoDB instead of file data
- Pros: Simple, no external dependencies
- Cons: Not scalable, backup complexity

### Option 2: Cloud Storage (Recommended)
Use cloud storage service:
- **AWS S3** / **Google Cloud Storage** / **Azure Blob Storage**
- Store file URL in MongoDB
- Pros: Scalable, reliable, CDN support
- Cons: Requires cloud account, additional setup

### Option 3: GridFS (MongoDB)
Use MongoDB GridFS for large files:
- Stores files in chunks in MongoDB
- Handles files larger than 16MB
- Pros: No external dependencies, handles large files
- Cons: Still uses MongoDB storage, not ideal for very large files

## Current File Flow

1. **Upload**:
   - Client encrypts file using E2EE
   - Sends base64-encoded encrypted data to API
   - API stores in MongoDB `sharedFiles` array

2. **Download**:
   - Client requests file by ID
   - API retrieves from MongoDB
   - Returns encrypted data
   - Client decrypts using shared key

3. **List**:
   - Client requests all files for session
   - API returns file metadata from `sharedFiles` array

## File Size Limits

- **Current Limit**: 10MB per file (enforced in API)
- **MongoDB Limit**: 16MB per document (total of all files in session)
- **Recommendation**: Implement proper file storage for production

## Security

- ✅ Files are encrypted client-side before upload (E2EE)
- ✅ Server never sees unencrypted file content
- ✅ Files stored encrypted in database
- ✅ Decryption happens client-side only

## Next Steps

For production, consider:
1. Implementing cloud storage (S3/GCS/Azure)
2. Adding file cleanup after session ends
3. Implementing file size limits per session
4. Adding file compression before encryption
5. Implementing file expiration/retention policies
