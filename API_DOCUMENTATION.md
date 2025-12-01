# API Documentation

## Authentication Endpoints

### Register User

**POST** `/api/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "email": "doctor@clinic.com",
  "password": "securepassword123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "doctor",
  "tenantId": "507f1f77bcf86cd799439011" // Optional for super_admin
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439012",
      "email": "doctor@clinic.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "doctor",
      "tenantId": "507f1f77bcf86cd799439011"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": [...]
  }
}
```

---

### Login

**POST** `/api/auth/login`

Login and receive JWT tokens.

**Request Body:**
```json
{
  "email": "doctor@clinic.com",
  "password": "securepassword123",
  "tenantId": "507f1f77bcf86cd799439011" // Optional
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439012",
      "email": "doctor@clinic.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "doctor",
      "tenantId": "507f1f77bcf86cd799439011"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Note:** Refresh token is also set as HTTP-only cookie.

**Error Response (401):**
```json
{
  "success": false,
  "error": {
    "message": "Invalid email or password",
    "code": "LOGIN_ERROR"
  }
}
```

---

### Refresh Token

**POST** `/api/auth/refresh`

Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Or:** Refresh token can be sent as HTTP-only cookie (from login).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": {
    "message": "Invalid or expired refresh token",
    "code": "REFRESH_ERROR"
  }
}
```

---

### Get Current User

**GET** `/api/auth/me`

Get current authenticated user profile.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "email": "doctor@clinic.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "doctor",
    "tenantId": "507f1f77bcf86cd799439011",
    "tenant": {
      "name": "City Clinic",
      "slug": "city-clinic",
      "region": "US",
      "settings": {
        "currency": "USD",
        "locale": "en-US",
        "timezone": "America/New_York"
      }
    },
    "isActive": true,
    "lastLoginAt": "2024-01-15T10:30:00Z",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": {
    "message": "Missing or invalid authorization header",
    "code": "UNAUTHORIZED"
  }
}
```

---

### Logout

**POST** `/api/auth/logout`

Logout user (clears refresh token cookie).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

## Health Check

### Health Check

**GET** `/api/health`

Check system health and database connection.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00Z",
    "database": "connected"
  }
}
```

---

## Authentication

All protected endpoints require an `Authorization` header:

```
Authorization: Bearer <accessToken>
```

Access tokens expire in 2 hours by default (configurable via `JWT_EXPIRES_IN` environment variable).

The system implements automatic token refresh on user activity and will automatically log out users who are idle for 2 hours to comply with security best practices.

Use the refresh token endpoint to get a new access token manually, or tokens will refresh automatically on user activity.

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE",
    "details": {} // Optional additional details
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR` - Input validation failed
- `UNAUTHORIZED` - Missing or invalid token
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `DUPLICATE_ERROR` - Resource already exists
- `INTERNAL_ERROR` - Server error

---

## User Roles

- `super_admin` - System administrator
- `clinic_admin` - Clinic administrator
- `doctor` - Doctor
- `nurse` - Nurse
- `receptionist` - Receptionist
- `accountant` - Accountant
- `pharmacist` - Pharmacist

---

## Patient Endpoints

### List Patients

**GET** `/api/patients`

Get paginated list of patients with optional filters.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 20, max: 100)
- `search` (optional) - Search in name, patientId, phone, email
- `gender` (optional) - Filter by gender (male/female/other/prefer_not_to_say)
- `bloodGroup` (optional) - Filter by blood group
- `isActive` (optional) - Filter by active status (true/false)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "507f1f77bcf86cd799439012",
        "patientId": "PAT-0001",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "dateOfBirth": "1990-01-15T00:00:00Z",
        "gender": "male",
        "bloodGroup": "O+",
        "isActive": true,
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

---

### Get Patient by ID

**GET** `/api/patients/:id`

Get a single patient by ID.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "patientId": "PAT-0001",
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1990-01-15T00:00:00Z",
    "gender": "male",
    "bloodGroup": "O+",
    "email": "john@example.com",
    "phone": "+1234567890",
    "alternatePhone": "+1234567891",
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    },
    "nationalId": "123-45-6789",
    "insuranceId": "INS-12345",
    "medicalHistory": "Previous surgery in 2020",
    "allergies": "Peanuts, Shellfish",
    "currentMedications": "Aspirin 100mg daily",
    "emergencyContact": {
      "name": "Jane Doe",
      "relationship": "Spouse",
      "phone": "+1234567892",
      "email": "jane@example.com"
    },
    "attachments": [],
    "notes": "Regular patient",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Note:** PHI fields (medicalHistory, allergies, currentMedications, nationalId) are automatically encrypted at rest and decrypted when retrieved.

---

### Create Patient

**POST** `/api/patients`

Create a new patient.

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-15T00:00:00Z",
  "gender": "male",
  "bloodGroup": "O+",
  "email": "john@example.com",
  "phone": "+1234567890",
  "alternatePhone": "+1234567891",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "patientId": "PAT-0001",
  "nationalId": "123-45-6789",
  "insuranceId": "INS-12345",
  "medicalHistory": "Previous surgery in 2020",
  "allergies": "Peanuts, Shellfish",
  "currentMedications": "Aspirin 100mg daily",
  "emergencyContact": {
    "name": "Jane Doe",
    "relationship": "Spouse",
    "phone": "+1234567892",
    "email": "jane@example.com"
  },
  "notes": "Regular patient"
}
```

**Note:** `patientId` is optional - if not provided, system will auto-generate (e.g., PAT-0001, PAT-0002).

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "patientId": "PAT-0001",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "dateOfBirth": "1990-01-15T00:00:00Z",
    "gender": "male",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### Update Patient

**PUT** `/api/patients/:id`

Update an existing patient.

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body:** (all fields optional)
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "email": "newemail@example.com",
  "medicalHistory": "Updated medical history",
  "allergies": "Updated allergies list"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "patientId": "PAT-0001",
    "firstName": "John",
    "lastName": "Doe",
    "email": "newemail@example.com",
    "phone": "+1234567890",
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}
```

**Note:** `patientId` cannot be changed after creation.

---

### Delete Patient

**DELETE** `/api/patients/:id`

Soft delete a patient (marks as deleted, doesn't remove from database).

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Patient deleted successfully"
  }
}
```

**Note:** Soft-deleted patients are excluded from list queries but remain in database for audit/compliance purposes.

---

## Appointment Endpoints

### List Appointments

**GET** `/api/appointments`

Get paginated list of appointments with optional filters.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 20, max: 100)
- `patientId` (optional) - Filter by patient ID
- `doctorId` (optional) - Filter by doctor ID
- `status` (optional) - Filter by status (scheduled/confirmed/arrived/in_queue/in_progress/completed/cancelled/no_show)
- `type` (optional) - Filter by type (consultation/follow_up/checkup/emergency/procedure/lab_test)
- `date` (optional) - Filter by specific date (YYYY-MM-DD)
- `startDate` (optional) - Filter from date
- `endDate` (optional) - Filter to date
- `isActive` (optional) - Filter by active status (true/false)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "507f1f77bcf86cd799439012",
        "patientId": {
          "firstName": "John",
          "lastName": "Doe",
          "patientId": "PAT-0001",
          "phone": "+1234567890"
        },
        "doctorId": {
          "firstName": "Dr. Jane",
          "lastName": "Smith"
        },
        "appointmentDate": "2024-01-20T00:00:00Z",
        "startTime": "2024-01-20T10:00:00Z",
        "endTime": "2024-01-20T10:30:00Z",
        "duration": 30,
        "type": "consultation",
        "status": "scheduled",
        "reminderSent": false
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

---

### Get Appointment by ID

**GET** `/api/appointments/:id`

Get a single appointment by ID.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "patientId": {
      "firstName": "John",
      "lastName": "Doe",
      "patientId": "PAT-0001",
      "phone": "+1234567890",
      "email": "john@example.com"
    },
    "doctorId": {
      "firstName": "Dr. Jane",
      "lastName": "Smith",
      "email": "jane@clinic.com"
    },
    "appointmentDate": "2024-01-20T00:00:00Z",
    "startTime": "2024-01-20T10:00:00Z",
    "endTime": "2024-01-20T10:30:00Z",
    "duration": 30,
    "type": "consultation",
    "status": "scheduled",
    "reason": "Annual checkup",
    "notes": "Patient prefers morning appointments",
    "reminderSent": false,
    "reminderScheduledAt": "2024-01-19T10:00:00Z",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### Create Appointment

**POST** `/api/appointments`

Create a new appointment. Automatically checks for time slot conflicts.

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "patientId": "507f1f77bcf86cd799439011",
  "doctorId": "507f1f77bcf86cd799439010",
  "appointmentDate": "2024-01-20T00:00:00Z",
  "startTime": "2024-01-20T10:00:00Z",
  "endTime": "2024-01-20T10:30:00Z",
  "duration": 30,
  "type": "consultation",
  "reason": "Annual checkup",
  "notes": "Patient prefers morning appointments",
  "reminderScheduledAt": "2024-01-19T10:00:00Z"
}
```

**Note:** 
- `endTime` is optional - will be calculated from `startTime` + `duration`
- `duration` defaults to 30 minutes if not provided
- `reminderScheduledAt` defaults to 24 hours before appointment if not provided
- System validates time slot availability before creating

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "patientId": "507f1f77bcf86cd799439011",
    "doctorId": "507f1f77bcf86cd799439010",
    "appointmentDate": "2024-01-20T00:00:00Z",
    "startTime": "2024-01-20T10:00:00Z",
    "endTime": "2024-01-20T10:30:00Z",
    "duration": 30,
    "type": "consultation",
    "status": "scheduled",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": {
    "message": "Time slot is not available",
    "code": "CREATE_ERROR"
  }
}
```

---

### Update Appointment

**PUT** `/api/appointments/:id`

Update an existing appointment. Cannot update completed or cancelled appointments.

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body:** (all fields optional)
```json
{
  "startTime": "2024-01-20T11:00:00Z",
  "duration": 45,
  "reason": "Updated reason",
  "notes": "Updated notes"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "startTime": "2024-01-20T11:00:00Z",
    "endTime": "2024-01-20T11:45:00Z",
    "status": "scheduled",
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}
```

---

### Change Appointment Status

**PUT** `/api/appointments/:id/status`

Change appointment status (arrived, in_progress, completed, cancelled, etc.).

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "arrived",
  "notes": "Patient arrived on time"
}
```

**Status Values:**
- `scheduled` - Appointment is scheduled
- `confirmed` - Appointment is confirmed
- `arrived` - Patient has arrived
- `in_queue` - Patient is in waiting queue
- `in_progress` - Appointment is in progress
- `completed` - Appointment is completed
- `cancelled` - Appointment is cancelled
- `no_show` - Patient did not show up

**For cancellation:**
```json
{
  "status": "cancelled",
  "cancellationReason": "Patient requested cancellation"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "status": "arrived",
    "arrivedAt": "2024-01-20T10:05:00Z"
  }
}
```

**Note:** System automatically sets timestamps based on status:
- `arrived` → sets `arrivedAt`
- `in_progress` → sets `startedAt`
- `completed` → sets `completedAt`
- `cancelled` → sets `cancelledAt` and `cancelledBy`

---

### Delete Appointment

**DELETE** `/api/appointments/:id`

Soft delete an appointment.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Appointment deleted successfully"
  }
}
```

---

### Process Reminders (Cron)

**POST** `/api/cron/reminders`

Process pending appointment reminders. Should be called by a cron job.

**Note:** In production, protect this endpoint with authentication.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Reminders processed",
    "processed": 5,
    "sent": 4,
    "failed": 1
  }
}
```

---

