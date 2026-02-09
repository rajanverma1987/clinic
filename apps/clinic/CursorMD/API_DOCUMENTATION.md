# API Documentation

**Last Updated:** January 2025  
**Base URL:** `https://your-domain.com/api`

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## Response Format

All API responses follow this structure:

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "code": "ERROR_CODE"
  }
}
```

## Rate Limiting

- **Public endpoints:** 100 requests per 15 minutes
- **Auth endpoints:** 5 requests per 15 minutes
- **API endpoints:** 60 requests per minute
- **Strict endpoints:** 10 requests per minute

Rate limit headers are included in all responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Unix timestamp when limit resets

---

## Authentication Endpoints

### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "doctor",
  "tenantId": "tenant-id"
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "tenantId": "tenant-id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "doctor"
    },
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token"
  }
}
```

### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "jwt-refresh-token"
}
```

### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <access_token>
```

---

## Patient Endpoints

### List Patients
```http
GET /api/patients?page=1&limit=20&search=john&gender=male
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 50)
- `search` - Search in name, patientId, phone, email
- `gender` - Filter by gender
- `bloodGroup` - Filter by blood group
- `isActive` - Filter by active status

### Create Patient
```http
POST /api/patients
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "dateOfBirth": "1990-01-15",
  "gender": "female",
  "phone": "+1234567890",
  "email": "jane@example.com",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "US"
  }
}
```

### Get Patient
```http
GET /api/patients/:id
Authorization: Bearer <access_token>
```

### Update Patient
```http
PUT /api/patients/:id
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "phone": "+1234567890",
  "address": {
    "city": "Boston"
  }
}
```

### Delete Patient
```http
DELETE /api/patients/:id
Authorization: Bearer <access_token>
```

---

## Appointment Endpoints

### List Appointments
```http
GET /api/appointments?page=1&limit=20&doctorId=doctor-id&status=scheduled
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page`, `limit` - Pagination
- `patientId` - Filter by patient
- `doctorId` - Filter by doctor
- `status` - Filter by status
- `type` - Filter by type
- `startDate`, `endDate` - Date range filter

### Create Appointment
```http
POST /api/appointments
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "patientId": "patient-id",
  "doctorId": "doctor-id",
  "appointmentDate": "2025-01-30",
  "startTime": "2025-01-30T10:00:00Z",
  "duration": 30,
  "type": "consultation",
  "departmentId": "dept-id"
}
```

### Update Appointment
```http
PUT /api/appointments/:id
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "startTime": "2025-01-30T11:00:00Z",
  "duration": 45
}
```

### Change Appointment Status
```http
PUT /api/appointments/:id/status
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "status": "confirmed"
}
```

---

## Clinical Notes Endpoints

### List Clinical Notes
```http
GET /api/clinical-notes?patientId=patient-id&type=soap
Authorization: Bearer <access_token>
```

### Create Clinical Note
```http
POST /api/clinical-notes
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "patientId": "patient-id",
  "appointmentId": "appointment-id",
  "doctorId": "doctor-id",
  "type": "soap",
  "soap": {
    "subjective": "Patient complains of headache",
    "objective": "BP: 120/80, Temp: 98.6F",
    "assessment": "Tension headache",
    "plan": "Prescribe pain medication"
  }
}
```

### Get Note Versions
```http
GET /api/clinical-notes/:id/versions
Authorization: Bearer <access_token>
```

---

## Prescription Endpoints

### List Prescriptions
```http
GET /api/prescriptions?patientId=patient-id&status=active
Authorization: Bearer <access_token>
```

### Create Prescription
```http
POST /api/prescriptions
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "patientId": "patient-id",
  "doctorId": "doctor-id",
  "items": [
    {
      "itemType": "drug",
      "drugId": "drug-id",
      "drugName": "Paracetamol",
      "quantity": 10,
      "frequency": "twice daily",
      "duration": 5
    }
  ],
  "validUntil": "2025-02-15"
}
```

---

## Billing Endpoints

### List Invoices
```http
GET /api/invoices?patientId=patient-id&status=pending
Authorization: Bearer <access_token>
```

### Create Invoice
```http
POST /api/invoices
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "patientId": "patient-id",
  "appointmentId": "appointment-id",
  "items": [
    {
      "type": "consultation",
      "description": "General Consultation",
      "quantity": 1,
      "unitPrice": 10000,
      "taxRate": 10
    }
  ],
  "region": "US"
}
```

### Create Payment
```http
POST /api/payments
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "invoiceId": "invoice-id",
  "patientId": "patient-id",
  "amount": 11000,
  "paymentMethod": "card",
  "paymentDate": "2025-01-25"
}
```

---

## Lab Endpoints

### List Lab Tests
```http
GET /api/lab-tests?search=blood
Authorization: Bearer <access_token>
```

### Create Lab Order
```http
POST /api/lab-orders
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "patientId": "patient-id",
  "doctorId": "doctor-id",
  "tests": [
    {
      "testId": "test-id",
      "testName": "Complete Blood Count",
      "priority": "routine"
    }
  ],
  "sample": {
    "type": "blood"
  }
}
```

### Create Lab Result
```http
POST /api/lab-results
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "orderId": "order-id",
  "patientId": "patient-id",
  "testId": "test-id",
  "results": [
    {
      "parameter": "Hemoglobin",
      "value": "14.5",
      "unit": "g/dL",
      "referenceRange": "12.0-16.0",
      "flag": "normal"
    }
  ]
}
```

---

## Inventory Endpoints

### List Inventory Items
```http
GET /api/inventory/items?lowStock=true&type=medicine
Authorization: Bearer <access_token>
```

### Create Inventory Item
```http
POST /api/inventory/items
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Paracetamol 500mg",
  "code": "PAR-500",
  "type": "medicine",
  "totalQuantity": 100,
  "lowStockThreshold": 20,
  "costPrice": 500,
  "sellingPrice": 1000,
  "currency": "USD"
}
```

### List Stock Batches
```http
GET /api/inventory/batches?medicineId=medicine-id&expiringSoon=30
Authorization: Bearer <access_token>
```

### Create Stock Batch
```http
POST /api/inventory/batches
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "medicineId": "medicine-id",
  "batchNumber": "BATCH-001",
  "quantity": 50,
  "purchasePrice": 500,
  "sellingPrice": 1000,
  "expiryDate": "2026-12-31"
}
```

---

## Report Endpoints

### Revenue Report
```http
GET /api/reports/revenue?startDate=2025-01-01&endDate=2025-01-31&format=json
Authorization: Bearer <access_token>
```

### Patient Report
```http
GET /api/reports/patients?startDate=2025-01-01&endDate=2025-01-31&groupBy=month
Authorization: Bearer <access_token>
```

### Appointment Report
```http
GET /api/reports/appointments?startDate=2025-01-01&endDate=2025-01-31&doctorId=doctor-id
Authorization: Bearer <access_token>
```

### Doctor Performance Report
```http
GET /api/reports/doctors?startDate=2025-01-01&endDate=2025-01-31
Authorization: Bearer <access_token>
```

### Department Report
```http
GET /api/reports/departments?startDate=2025-01-01&endDate=2025-01-31
Authorization: Bearer <access_token>
```

---

## Notification Endpoints

### List Notifications
```http
GET /api/notifications?read=false&type=appointment
Authorization: Bearer <access_token>
```

### Create Notification
```http
POST /api/notifications
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "userId": "user-id",
  "type": "appointment",
  "title": "Appointment Reminder",
  "message": "You have an appointment tomorrow",
  "channels": {
    "email": true,
    "sms": true,
    "whatsapp": false
  },
  "userEmail": "patient@example.com",
  "userPhone": "+1234567890"
}
```

### Mark Notification as Read
```http
PUT /api/notifications/:id/read
Authorization: Bearer <access_token>
```

---

## Patient Portal Endpoints

### Register for Portal
```http
POST /api/patient-portal/auth/register
Content-Type: application/json

{
  "email": "patient@example.com",
  "phone": "+1234567890",
  "password": "SecurePass123!",
  "tenantId": "tenant-id"
}
```

### Patient Login
```http
POST /api/patient-portal/auth/login
Content-Type: application/json

{
  "email": "patient@example.com",
  "password": "SecurePass123!",
  "tenantId": "tenant-id"
}
```

### Get Patient Profile
```http
GET /api/patient-portal/profile?patientId=patient-id
Authorization: Bearer <access_token>
```

### Get Patient Appointments
```http
GET /api/patient-portal/appointments?patientId=patient-id
Authorization: Bearer <access_token>
```

---

## GDPR Endpoints

### Export Patient Data
```http
POST /api/gdpr/export
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "patientId": "patient-id",
  "format": "json"
}
```

### Rectify Patient Data
```http
POST /api/gdpr/rectify
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "patientId": "patient-id",
  "corrections": {
    "email": "newemail@example.com",
    "phone": "+1234567890"
  }
}
```

### Anonymize Patient Data
```http
POST /api/gdpr/anonymize
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "patientId": "patient-id"
}
```

### Delete Patient Data
```http
POST /api/gdpr/delete
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "patientId": "patient-id",
  "reason": "Patient requested data deletion",
  "confirm": true
}
```

---

## WhatsApp Endpoints

### Send WhatsApp Message
```http
POST /api/whatsapp/messages
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "phoneNumber": "+1234567890",
  "message": "Your appointment is tomorrow at 10 AM",
  "patientId": "patient-id"
}
```

### List WhatsApp Messages
```http
GET /api/whatsapp/messages?patientId=patient-id&direction=outbound
Authorization: Bearer <access_token>
```

### Get Conversation Thread
```http
GET /api/whatsapp/conversations/:patientId
Authorization: Bearer <access_token>
```

---

## Reminder Endpoints

### Process Reminders (Cron)
```http
POST /api/reminders/process
Authorization: Bearer <access_token>
```

This endpoint processes all pending reminders (appointments, payments, prescriptions).

---

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Input validation failed |
| `AUTHENTICATION_ERROR` | Invalid or expired token |
| `FORBIDDEN_ERROR` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INTERNAL_ERROR` | Server error |

---

## Pagination

All list endpoints support pagination:

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 50)

**Response Format:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error
