# Clinic Management SaaS - Project Blueprint

**Version:** 1.0  
**Last Updated:** December 2024  
**Project:** Multi-tenant Healthcare Management System  
**Status:** Production-Ready (with improvements needed)

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture Overview](#architecture-overview)
3. [Technology Stack](#technology-stack)
4. [Directory Structure](#directory-structure)
5. [Database Schema](#database-schema)
6. [API Architecture](#api-architecture)
7. [Services Layer](#services-layer)
8. [Security & Compliance](#security--compliance)
9. [Multi-Tenancy Architecture](#multi-tenancy-architecture)
10. [Features & Modules](#features--modules)
11. [Data Flow](#data-flow)
12. [Frontend Architecture](#frontend-architecture)
13. [Integration Points](#integration-points)
14. [Deployment Architecture](#deployment-architecture)

---

## 🎯 Project Overview

### Purpose
A global-ready, multi-tenant clinic management SaaS platform designed for healthcare providers worldwide. The system supports HIPAA, GDPR, and other regional compliance requirements while providing comprehensive clinic management features.

### Key Characteristics
- **Multi-tenant:** Complete tenant isolation at database and application level
- **Compliance-ready:** HIPAA, GDPR, PIPEDA, Privacy Act support
- **Global-ready:** Multi-region, multi-currency, multi-language support
- **API-first:** Designed for future mobile app integration
- **Real-time:** Socket.IO for chat, WebRTC for telemedicine
- **Subscription-based:** PayPal integration for billing

### Target Users
- **Super Admin:** Platform administrators
- **Clinic Admin:** Clinic-level administrators
- **Doctors:** Healthcare providers
- **Nurses:** Clinical staff
- **Receptionists:** Front desk staff
- **Accountants:** Billing staff
- **Pharmacists:** Pharmacy staff

---

## 🏗️ Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Web App    │  │  Mobile App  │  │  Admin Panel │      │
│  │  (Next.js)   │  │   (Future)   │  │   (Future)   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼─────────────────┼─────────────────┼──────────────┘
          │                 │                 │
          └─────────────────┼─────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────┐
│                    API GATEWAY LAYER                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Next.js API Routes (app/api/)                │   │
│  │  - Authentication & Authorization                    │   │
│  │  - Request Validation (Zod/Joi)                       │   │
│  │  - Rate Limiting                                     │   │
│  │  - Error Handling                                    │   │
│  └───────────────────────┬──────────────────────────────┘   │
└──────────────────────────┼──────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────┐
│                    SERVICE LAYER                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Business Logic Services (services/)                  │   │
│  │  - Patient Service                                    │   │
│  │  - Appointment Service                                │   │
│  │  - Prescription Service                              │   │
│  │  - Billing Service                                   │   │
│  │  - Telemedicine Service                              │   │
│  │  - Inventory Service                                 │   │
│  └───────────────────────┬──────────────────────────────┘   │
└──────────────────────────┼──────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────┐
│                    DATA LAYER                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   MongoDB    │  │    Redis     │  │  File Store  │      │
│  │  (Primary)   │  │   (Cache)    │  │   (Future)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              REAL-TIME & EXTERNAL SERVICES                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Socket.IO   │  │   WebRTC     │  │    PayPal    │      │
│  │   (Chat)     │  │ (Telemed)    │  │  (Billing)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Architecture Principles

1. **Service-Oriented:** Business logic in services, not API routes
2. **Tenant Isolation:** All queries filtered by tenantId
3. **API-First:** All features accessible via REST API
4. **Security by Default:** Encryption, audit logs, RBAC
5. **Compliance Built-in:** HIPAA/GDPR considerations in every module
6. **Scalable:** Designed for horizontal scaling

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** JavaScript (migrated from TypeScript)
- **Styling:** Tailwind CSS
- **State Management:** React Context API
- **HTTP Client:** Custom API client (`lib/api/client.js`)
- **Real-time:** Socket.IO Client
- **WebRTC:** Simple Peer

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Next.js API Routes
- **Database:** MongoDB 6+ (Mongoose ODM)
- **Cache:** Redis (optional)
- **Authentication:** JWT (access + refresh tokens)
- **Validation:** Zod + Joi
- **Real-time:** Socket.IO Server
- **WebRTC:** Simple Peer (peer-to-peer)

### Infrastructure
- **Server:** Custom HTTP server with Socket.IO (`server.js`)
- **Port:** 5053 (default)
- **Process Manager:** PM2 (production)
- **Environment:** dotenv

### Third-Party Integrations
- **Payment:** PayPal (subscriptions)
- **Email:** Nodemailer (SMTP)
- **File Storage:** Local (future: S3/Cloud Storage)

---

## 📁 Directory Structure

```
clinic/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── patients/             # Patient management
│   │   ├── appointments/         # Appointment management
│   │   ├── prescriptions/       # Prescription management
│   │   ├── invoices/             # Billing & invoicing
│   │   ├── inventory/            # Inventory management
│   │   ├── telemedicine/         # Telemedicine sessions
│   │   ├── queue/                # Queue management
│   │   ├── clinical-notes/       # Clinical documentation
│   │   ├── subscriptions/        # Subscription management
│   │   └── admin/                # Admin endpoints
│   ├── [pages]/                  # Frontend pages
│   ├── layout.jsx                # Root layout
│   └── globals.css               # Global styles
│
├── components/                   # React Components
│   ├── ui/                       # Reusable UI components
│   ├── appointments/             # Appointment components
│   ├── prescriptions/           # Prescription components
│   ├── invoices/                 # Invoice components
│   ├── telemedicine/             # Telemedicine components
│   └── layout/                  # Layout components
│
├── contexts/                     # React Contexts
│   ├── AuthContext.jsx          # Authentication state
│   ├── I18nContext.jsx          # Internationalization
│   └── FeatureContext.jsx       # Feature flags
│
├── lib/                          # Core Libraries
│   ├── api/                      # API client
│   ├── auth/                     # JWT utilities
│   ├── audit/                    # Audit logging
│   ├── db/                       # Database connection & helpers
│   ├── encryption/               # PHI encryption utilities
│   ├── features/                 # Feature access checking
│   ├── i18n/                     # Internationalization
│   ├── socket/                   # Socket.IO utilities
│   ├── utils/                    # Utility functions
│   ├── validations/              # Validation schemas
│   └── webrtc/                   # WebRTC utilities
│
├── middleware/                   # Middleware Functions
│   ├── auth.js                   # Authentication middleware
│   ├── role-check.js             # RBAC middleware
│   ├── tenant-validation.js      # Tenant access validation
│   └── feature-check.js          # Feature access middleware
│
├── models/                       # Mongoose Models
│   ├── Tenant.js                # Tenant model
│   ├── User.js                  # User model
│   ├── Patient.js               # Patient model
│   ├── Appointment.js           # Appointment model
│   ├── Prescription.js          # Prescription model
│   ├── Invoice.js               # Invoice model
│   ├── InventoryItem.js         # Inventory model
│   ├── TelemedicineSession.js  # Telemedicine model
│   └── [other models]
│
├── services/                     # Business Logic Services
│   ├── auth.service.js          # Authentication service
│   ├── patient.service.js       # Patient management
│   ├── appointment.service.js   # Appointment management
│   ├── prescription.service.js  # Prescription management
│   ├── billing.service.js       # Billing & invoicing
│   ├── inventory.service.js     # Inventory management
│   ├── telemedicine.service.js  # Telemedicine
│   ├── queue.service.js         # Queue management
│   ├── subscription.service.js  # Subscription management
│   └── [other services]
│
├── hooks/                        # Custom React Hooks
│   ├── useFeatures.js           # Feature access hook
│   ├── useSettings.js           # Settings hook
│   └── [other hooks]
│
├── data/                         # Static Data
│   └── common-lab-tests.json    # Lab test data
│
├── CursorMD/                     # Documentation
│   └── [documentation files]
│
├── server.js                     # Custom server with Socket.IO
├── next.config.js                # Next.js configuration
├── package.json                  # Dependencies
└── README.md                     # Project README
```

---

## 🗄️ Database Schema

### Core Models

#### Tenant
```javascript
{
  name: String (required),
  slug: String (required, unique),
  region: Enum ['US', 'EU', 'APAC', 'IN', 'ME', 'CA', 'AU'],
  settings: {
    currency: String (default: 'USD'),
    locale: String (default: 'en-US'),
    timezone: String (default: 'UTC'),
    prescriptionValidityDays: Number (default: 30),
    taxRules: {
      country: String,
      taxType: Enum ['GST', 'VAT', 'SALES_TAX'],
      rate: Number
    },
    complianceSettings: {
      hipaa: Boolean,
      gdpr: Boolean,
      pipeda: Boolean,
      privacyAct: Boolean
    },
    queueSettings: { ... },
    clinicHours: [ ... ],
    smtp: { ... }
  },
  isActive: Boolean (default: true),
  timestamps: true
}
```

#### User
```javascript
{
  tenantId: ObjectId (ref: 'Tenant', optional for super_admin),
  email: String (required, unique per tenant),
  password: String (required, hashed),
  firstName: String (required),
  lastName: String (required),
  role: Enum [
    'super_admin',
    'clinic_admin',
    'doctor',
    'nurse',
    'receptionist',
    'accountant',
    'pharmacist'
  ],
  isActive: Boolean (default: true),
  lastLoginAt: Date,
  lastLoginIP: String,
  passwordChangedAt: Date,
  timestamps: true
}
```

#### Patient
```javascript
{
  tenantId: ObjectId (required, ref: 'Tenant'),
  patientId: String (required, unique per tenant, auto-generated: PAT-0001),
  firstName: String (required, encrypted),
  lastName: String (required, encrypted),
  dateOfBirth: Date (required, encrypted),
  gender: Enum ['male', 'female', 'other'],
  phone: String (encrypted),
  email: String (encrypted),
  address: {
    street: String (encrypted),
    city: String (encrypted),
    state: String (encrypted),
    zipCode: String (encrypted),
    country: String (encrypted)
  },
  medicalHistory: String (encrypted),
  allergies: String (encrypted),
  medications: String (encrypted),
  nationalId: String (encrypted),
  bloodGroup: String,
  emergencyContact: { ... },
  isActive: Boolean (default: true),
  deletedAt: Date (soft delete),
  timestamps: true
}
```

#### Appointment
```javascript
{
  tenantId: ObjectId (required),
  appointmentId: String (auto-generated: APT-0001),
  patientId: ObjectId (required, ref: 'Patient'),
  doctorId: ObjectId (required, ref: 'User'),
  appointmentDate: Date (required),
  startTime: Date (required),
  endTime: Date (required),
  type: Enum ['consultation', 'follow_up', 'procedure', 'checkup'],
  status: Enum [
    'scheduled',
    'confirmed',
    'arrived',
    'in_queue',
    'in_progress',
    'completed',
    'cancelled',
    'no_show'
  ],
  notes: String,
  statusHistory: [{
    status: String,
    changedAt: Date,
    changedBy: ObjectId
  }],
  reminderSent: Boolean (default: false),
  reminderSentAt: Date,
  isActive: Boolean (default: true),
  deletedAt: Date,
  timestamps: true
}
```

#### Prescription
```javascript
{
  tenantId: ObjectId (required),
  prescriptionNumber: String (auto-generated: RX-0001),
  patientId: ObjectId (required, ref: 'Patient'),
  doctorId: ObjectId (required, ref: 'User'),
  appointmentId: ObjectId (ref: 'Appointment'),
  items: [{
    drugId: ObjectId (ref: 'Drug'),
    drugName: String,
    dosage: String,
    frequency: String,
    duration: String,
    instructions: String,
    quantity: Number
  }],
  diagnosis: String (encrypted),
  instructions: String (encrypted),
  status: Enum ['draft', 'active', 'dispensed', 'cancelled', 'expired'],
  validUntil: Date,
  refills: Number (default: 0),
  refillsRemaining: Number (default: 0),
  region: String,
  isActive: Boolean (default: true),
  deletedAt: Date,
  timestamps: true
}
```

#### Invoice
```javascript
{
  tenantId: ObjectId (required),
  invoiceNumber: String (auto-generated: INV-0001),
  patientId: ObjectId (required, ref: 'Patient'),
  appointmentId: ObjectId (ref: 'Appointment'),
  items: [{
    description: String,
    quantity: Number,
    unitPrice: Number (in minor units),
    total: Number (in minor units)
  }],
  subtotal: Number (in minor units),
  tax: Number (in minor units),
  discount: Number (in minor units),
  total: Number (in minor units),
  currency: String,
  status: Enum ['draft', 'pending', 'partial', 'paid', 'cancelled', 'refunded'],
  dueDate: Date,
  payments: [{
    amount: Number,
    method: String,
    paidAt: Date,
    transactionId: String
  }],
  isActive: Boolean (default: true),
  deletedAt: Date,
  timestamps: true
}
```

### Indexes

All collections have indexes on:
- `tenantId` (for tenant isolation)
- `tenantId + [other fields]` (compound indexes for common queries)
- Unique indexes where needed (e.g., `patientId` per tenant)

---

## 🔌 API Architecture

### API Response Format

All API responses follow this structure:

**Success Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "code": "ERROR_CODE",
    "details": { ... }
  }
}
```

### API Route Structure

```
app/api/
├── auth/
│   ├── login/route.js          POST   - User login
│   ├── register/route.js       POST   - User registration
│   ├── refresh/route.js        POST   - Refresh access token
│   ├── logout/route.js         POST   - User logout
│   ├── me/route.js              GET    - Get current user
│   ├── forgot-password/route.js POST  - Request password reset
│   └── reset-password/route.js  POST  - Reset password
│
├── patients/
│   ├── route.js                 GET, POST - List/Create patients
│   ├── [id]/route.js            GET, PUT, DELETE - Patient CRUD
│   └── upload/route.js          POST - Upload patient documents
│
├── appointments/
│   ├── route.js                 GET, POST - List/Create appointments
│   ├── [id]/route.js            GET, PUT, DELETE - Appointment CRUD
│   └── [id]/status/route.js     PUT - Update appointment status
│
├── prescriptions/
│   ├── route.js                 GET, POST - List/Create prescriptions
│   ├── [id]/route.js            GET, PUT, DELETE - Prescription CRUD
│   ├── [id]/activate/route.js  POST - Activate prescription
│   └── [id]/dispense/route.js   POST - Dispense prescription
│
├── invoices/
│   ├── route.js                 GET, POST - List/Create invoices
│   └── [id]/route.js            GET, PUT, DELETE - Invoice CRUD
│
├── inventory/
│   ├── items/
│   │   ├── route.js             GET, POST - List/Create items
│   │   └── [id]/route.js        GET, PUT, DELETE - Item CRUD
│   └── suppliers/route.js       GET, POST - Supplier management
│
├── telemedicine/
│   ├── sessions/route.js       GET, POST - List/Create sessions
│   ├── sessions/[id]/route.js  GET, PUT - Session management
│   └── signaling/[id]/route.js POST - WebRTC signaling
│
├── queue/
│   ├── route.js                 GET, POST - List/Add to queue
│   ├── [id]/route.js            GET, PUT, DELETE - Queue entry CRUD
│   └── [id]/status/route.js     PUT - Update queue status
│
├── subscriptions/
│   ├── route.js                 GET, POST - List/Create subscriptions
│   └── [id]/route.js            GET, PUT, DELETE - Subscription CRUD
│
└── admin/
    ├── clients/route.js         GET, POST - Tenant management
    └── subscription-plans/route.js GET, POST - Plan management
```

### Middleware Chain

```
Request
  ↓
Authentication Middleware (withAuth)
  ↓
Tenant Validation Middleware (withTenantValidation)
  ↓
Role Check Middleware (withRoleCheck) [optional]
  ↓
Feature Check Middleware (withFeatureCheck) [optional]
  ↓
API Route Handler
  ↓
Service Layer
  ↓
Database
  ↓
Response
```

### Authentication Flow

```
1. User submits credentials → POST /api/auth/login
2. Service validates credentials → auth.service.js
3. Generate JWT tokens (access + refresh)
4. Return tokens to client
5. Client stores tokens (accessToken in memory, refreshToken in localStorage)
6. Client includes accessToken in Authorization header for subsequent requests
7. Middleware validates token → middleware/auth.js
8. Token expires → Client calls POST /api/auth/refresh
9. Server validates refreshToken and issues new accessToken
```

---

## 🔧 Services Layer

### Service Architecture

Services contain all business logic and are called by API routes. They follow this pattern:

```javascript
// Example: patient.service.js
export async function createPatient(input, tenantId, userId) {
  await connectDB();
  
  // 1. Validate input
  // 2. Apply tenant isolation
  // 3. Encrypt PHI fields
  // 4. Generate auto-increment ID
  // 5. Save to database
  // 6. Audit log
  // 7. Return result
}
```

### Service List

| Service | Purpose | Key Functions |
|---------|---------|---------------|
| `auth.service.js` | Authentication & authorization | `registerUser`, `loginUser`, `refreshToken` |
| `patient.service.js` | Patient management | `createPatient`, `getPatientById`, `listPatients`, `updatePatient` |
| `appointment.service.js` | Appointment management | `createAppointment`, `updateAppointmentStatus`, `listAppointments` |
| `prescription.service.js` | Prescription management | `createPrescription`, `activatePrescription`, `dispensePrescription` |
| `billing.service.js` | Invoicing & payments | `createInvoice`, `processPayment`, `calculateTax` |
| `inventory.service.js` | Inventory management | `createItem`, `updateStock`, `checkLowStock` |
| `telemedicine.service.js` | Telemedicine sessions | `createSession`, `admitPatient`, `endSession` |
| `queue.service.js` | Queue management | `addToQueue`, `updateQueueStatus`, `getNextPatient` |
| `subscription.service.js` | Subscription management | `createSubscription`, `updateSubscription`, `cancelSubscription` |
| `clinical-note.service.js` | Clinical documentation | `createNote`, `updateNote`, `getVersionHistory` |
| `reminder.service.js` | Appointment reminders | `scheduleReminder`, `processReminders` |
| `report.service.js` | Reporting & analytics | `generateDashboard`, `generateReport` |
| `tax-engine.service.js` | Tax calculations | `calculateTax`, `getTaxRate` |
| `paypal.service.js` | PayPal integration | `createSubscription`, `handleWebhook` |

### Service Principles

1. **Tenant Isolation:** All services accept `tenantId` and filter queries
2. **PHI Encryption:** Services encrypt sensitive fields before saving
3. **Audit Logging:** Services log all create/update/delete operations
4. **Error Handling:** Services throw errors that API routes catch
5. **Validation:** Services validate input using Zod/Joi schemas
6. **No Direct DB Access:** Services use models, not raw MongoDB queries

---

## 🔒 Security & Compliance

### Security Features

#### 1. Authentication & Authorization
- **JWT Tokens:** Access token (2h expiry) + Refresh token (7d expiry)
- **Password Hashing:** bcryptjs with salt rounds of 12
- **Token Rotation:** Refresh tokens rotated on use
- **Idle Timeout:** 2-hour idle timeout with auto-logout

#### 2. PHI Encryption
- **Algorithm:** AES-256-GCM
- **Fields Encrypted:**
  - Patient: firstName, lastName, dateOfBirth, phone, email, address, medicalHistory, allergies, medications, nationalId
  - Prescription: diagnosis, instructions
  - Clinical Notes: SOAP fields, diagnosis, content
- **Key Management:** Environment variable `ENCRYPTION_KEY` (32-byte hex)

#### 3. Audit Logging
- **Framework:** `lib/audit/audit-logger.js`
- **Logged Actions:**
  - CREATE, UPDATE, DELETE operations
  - Sensitive reads (PHI access)
  - Authentication events (login, logout)
  - Permission changes
- **Log Fields:** userId, tenantId, action, resource, timestamp, IP address

#### 4. Access Control
- **RBAC:** Role-based access control via middleware
- **Tenant Isolation:** All queries filtered by tenantId
- **Resource Validation:** Middleware validates tenant access to resources

#### 5. Input Validation
- **Validation Libraries:** Zod (primary), Joi (secondary)
- **Sanitization:** All inputs sanitized to prevent injection
- **Error Messages:** User-friendly error messages (no raw DB errors)

### Compliance Features

#### HIPAA Compliance
- PHI encryption at rest
- Audit logs for all PHI access
- Access controls (RBAC)
- No PHI in logs, notifications, or URLs

#### GDPR Compliance
- Data retention policies (configurable per tenant)
- Right to deletion (soft delete with retention)
- Consent tracking (planned)
- Data export capability (planned)

#### Regional Compliance
- Region-specific prescription formats
- Region-specific tax calculations
- Region-specific data retention rules

---

## 🏢 Multi-Tenancy Architecture

### Tenant Isolation Strategy

#### Database Level
- **Tenant ID:** All collections include `tenantId` field
- **Indexes:** Compound indexes on `tenantId + [other fields]`
- **Queries:** All queries filtered by `tenantId` using `withTenant()` helper

```javascript
// Example: lib/db/tenant-helper.js
export function withTenant(tenantId, query = {}) {
  return {
    ...query,
    tenantId,
  };
}

// Usage in services
const filter = withTenant(tenantId, { status: 'active' });
const patients = await Patient.find(filter);
```

#### Application Level
- **Middleware:** `withTenantValidation` validates tenant access
- **Token Validation:** JWT tokens include tenantId
- **Resource Validation:** Middleware checks resource belongs to tenant

#### Super Admin Access
- **Special Case:** Super admin users have `tenantId: null`
- **Access:** Can access all tenants (for platform administration)
- **Queries:** Super admin queries don't filter by tenantId

### Tenant Settings

Each tenant has configurable settings:
- **Region:** US, EU, APAC, IN, ME, CA, AU
- **Currency:** USD, EUR, INR, etc.
- **Locale:** en-US, en-GB, fr-FR, etc.
- **Timezone:** UTC, America/New_York, etc.
- **Tax Rules:** GST, VAT, Sales Tax
- **Compliance:** HIPAA, GDPR, PIPEDA, Privacy Act
- **Queue Settings:** Display order, consultation time, etc.
- **Clinic Hours:** Day-wise time slots
- **SMTP:** Email configuration

---

## 📦 Features & Modules

### Core Modules

#### 1. Patient Management ✅
- **Features:**
  - Patient registration with auto-generated IDs (PAT-0001)
  - PHI encryption (name, DOB, contact, medical history)
  - Patient search and filtering
  - Soft delete support
  - Document upload support
- **API:** `/api/patients`
- **Service:** `patient.service.js`

#### 2. Appointment Management ✅
- **Features:**
  - Appointment scheduling with conflict detection
  - Multiple statuses (scheduled → completed)
  - Status change tracking
  - Reminder system (24h before)
  - Time slot management
- **API:** `/api/appointments`
- **Service:** `appointment.service.js`

#### 3. Prescription Management ✅
- **Features:**
  - Prescription creation with drug database
  - Auto-generated prescription numbers (RX-0001)
  - Region-specific formatting
  - Refill tracking
  - Status management (draft → dispensed)
  - PHI encryption (diagnosis, instructions)
- **API:** `/api/prescriptions`
- **Service:** `prescription.service.js`

#### 4. Billing & Invoicing ✅
- **Features:**
  - Invoice creation with itemized billing
  - Auto-generated invoice numbers (INV-0001)
  - Multi-currency support (amounts in minor units)
  - Tax calculation (GST, VAT, Sales Tax)
  - Payment tracking
  - Discount support
- **API:** `/api/invoices`, `/api/payments`
- **Service:** `billing.service.js`, `tax-engine.service.js`

#### 5. Inventory Management ✅
- **Features:**
  - Medicine and supply stock management
  - Batch/expiry date tracking
  - Low stock alerts
  - Supplier management
  - Stock transactions (purchase, sale, adjustment)
  - Multi-currency pricing
- **API:** `/api/inventory`
- **Service:** `inventory.service.js`

#### 6. Clinical Notes ✅
- **Features:**
  - SOAP note structure
  - Multiple note types (SOAP, progress, consultation)
  - Note templates
  - Version history
  - PHI encryption
  - ICD-10 and SNOMED CT code support
- **API:** `/api/clinical-notes`
- **Service:** `clinical-note.service.js`

#### 7. Queue Management ✅
- **Features:**
  - Add patients to queue
  - Queue status management
  - Priority-based ordering
  - Estimated wait time
  - Queue display (public/private)
- **API:** `/api/queue`
- **Service:** `queue.service.js`

#### 8. Telemedicine ✅
- **Features:**
  - Video consultation sessions
  - WebRTC peer-to-peer connection
  - Real-time chat (Socket.IO)
  - Waiting room
  - Session recording (planned)
  - Screen sharing (planned)
- **API:** `/api/telemedicine`
- **Service:** `telemedicine.service.js`

#### 9. Subscription Management ✅
- **Features:**
  - Multiple subscription plans
  - PayPal integration
  - Feature-based access control
  - Subscription lifecycle management
  - Webhook handling
- **API:** `/api/subscriptions`
- **Service:** `subscription.service.js`, `paypal.service.js`

#### 10. Reporting ⚠️
- **Features:**
  - Dashboard statistics
  - Patient reports
  - Financial reports (planned)
  - Appointment reports (planned)
- **API:** `/api/reports`
- **Service:** `report.service.js`

### Feature Access Control

Features are gated by subscription plans:
- **Free Plan:** Basic features
- **Professional Plan:** Advanced features
- **Enterprise Plan:** All features + custom integrations

Feature checking:
```javascript
// Middleware: middleware/feature-check.js
export function withFeatureCheck(featureName) {
  return (handler) => {
    return async (req, user) => {
      const hasAccess = await checkFeatureAccess(user.tenantId, featureName);
      if (!hasAccess) {
        return NextResponse.json(
          errorResponse('Feature not available in your plan', 'FEATURE_RESTRICTED'),
          { status: 403 }
        );
      }
      return handler(req, user);
    };
  };
}
```

---

## 🔄 Data Flow

### Patient Registration Flow

```
1. User fills form → Frontend
2. POST /api/patients → API Route
3. withAuth middleware → Validate JWT
4. withTenantValidation → Validate tenant access
5. patient.service.js → Business logic
   - Validate input (Zod)
   - Generate patientId (PAT-0001)
   - Encrypt PHI fields
   - Save to database (with tenantId)
   - Audit log
6. Return success response
7. Frontend updates UI
```

### Appointment Creation Flow

```
1. User selects patient & time → Frontend
2. POST /api/appointments → API Route
3. Authentication & validation → Middleware
4. appointment.service.js → Business logic
   - Check time slot conflicts
   - Validate patient exists
   - Create appointment
   - Schedule reminder (24h before)
   - Audit log
5. Return appointment data
6. Frontend shows confirmation
```

### Prescription Workflow

```
1. Doctor creates prescription → Frontend
2. POST /api/prescriptions → API Route
3. prescription.service.js → Business logic
   - Validate drugs (regional availability)
   - Generate prescription number (RX-0001)
   - Encrypt diagnosis & instructions
   - Save as 'draft'
4. Doctor activates → POST /api/prescriptions/[id]/activate
5. Status changes to 'active'
6. Pharmacist dispenses → POST /api/prescriptions/[id]/dispense
7. Status changes to 'dispensed'
8. Update inventory stock
```

### Billing Flow

```
1. Create invoice for appointment → POST /api/invoices
2. billing.service.js → Business logic
   - Calculate subtotal
   - Apply tax (tax-engine.service.js)
   - Apply discount
   - Generate invoice number (INV-0001)
   - Save invoice
3. Patient makes payment → POST /api/payments
4. Update invoice status (pending → paid)
5. Update payment records
6. Generate receipt (planned)
```

---

## 🎨 Frontend Architecture

### Component Structure

```
components/
├── ui/                    # Reusable UI components
│   ├── Button.jsx
│   ├── Input.jsx
│   ├── Modal.jsx
│   ├── Table.jsx
│   └── ...
├── layout/                # Layout components
│   ├── Layout.jsx         # Main layout wrapper
│   └── Sidebar.jsx        # Navigation sidebar
├── appointments/          # Appointment components
│   └── AppointmentCalendar.jsx
├── prescriptions/         # Prescription components
│   ├── PrescriptionFormPrintPreview.jsx
│   └── PrescriptionPrintTemplate.jsx
└── telemedicine/          # Telemedicine components
    └── [video components]
```

### State Management

- **React Context API:**
  - `AuthContext`: User authentication state
  - `I18nContext`: Internationalization
  - `FeatureContext`: Feature flags

- **Local State:**
  - React hooks (`useState`, `useEffect`)
  - Form state management

### API Client

Custom API client (`lib/api/client.js`):
- Automatic token injection
- Token refresh on 401
- Error handling
- Request/response interceptors

### Routing

Next.js App Router:
- File-based routing
- Server components for data fetching
- Client components for interactivity

---

## 🔗 Integration Points

### External Integrations

#### 1. PayPal Integration
- **Purpose:** Subscription billing
- **Service:** `paypal.service.js`
- **Endpoints:**
  - Create subscription plan
  - Create subscription
  - Handle webhooks
- **Webhook:** `/api/webhooks/paypal`

#### 2. SMTP/Email
- **Purpose:** Email notifications
- **Library:** Nodemailer
- **Configuration:** Per-tenant SMTP settings
- **Use Cases:**
  - Appointment reminders
  - Password reset
  - Invoice emails (planned)

#### 3. Socket.IO
- **Purpose:** Real-time chat in telemedicine
- **Server:** Custom server (`server.js`)
- **Events:**
  - `join-session`
  - `chat-message`
  - `typing`
  - `leave-session`

#### 4. WebRTC
- **Purpose:** Video calls in telemedicine
- **Library:** Simple Peer
- **Signaling:** `/api/telemedicine/signaling/[id]`
- **TURN Server:** OVH (configured)

### Future Integrations

- **Lab Systems:** HL7/FHIR integration
- **Radiology:** DICOM integration
- **Pharmacy:** E-prescription networks
- **Insurance:** Insurance verification APIs
- **Payment Gateways:** Stripe, Razorpay
- **SMS/WhatsApp:** Appointment reminders

---

## 🚀 Deployment Architecture

### Current Setup

- **Server:** Custom Node.js server with Socket.IO
- **Port:** 5053
- **Process Manager:** PM2 (production)
- **Database:** MongoDB (external)
- **Cache:** Redis (optional)

### Recommended Production Setup

```
┌─────────────────────────────────────────┐
│         Load Balancer (Nginx)            │
└──────────────┬───────────────────────────┘
               │
    ┌──────────┴──────────┐
    │                     │
┌───▼────┐          ┌────▼───┐
│ App 1  │          │ App 2  │  (Multiple instances)
│ :5053  │          │ :5053  │
└───┬────┘          └────┬───┘
    │                    │
    └──────────┬─────────┘
               │
    ┌──────────▼──────────┐
    │   MongoDB Cluster   │
    │   (Replica Set)     │
    └─────────────────────┘
               │
    ┌──────────▼──────────┐
    │   Redis Cluster     │
    │   (Optional)         │
    └─────────────────────┘
```

### Environment Variables

Required environment variables:
```env
# Database
MONGODB_URI=mongodb://...

# Authentication
JWT_SECRET=<64-char-hex>
JWT_REFRESH_SECRET=<64-char-hex>
JWT_EXPIRES_IN=2h
JWT_REFRESH_EXPIRES_IN=7d

# Encryption
ENCRYPTION_KEY=<64-char-hex>

# Server
PORT=5053
HOSTNAME=localhost
NODE_ENV=production

# PayPal (optional)
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_MODE=sandbox|live

# Redis (optional)
REDIS_URL=redis://...

# App URL
NEXT_PUBLIC_APP_URL=https://...
```

### Deployment Checklist

- [ ] Set strong JWT secrets (64+ characters)
- [ ] Set encryption key (64-character hex)
- [ ] Configure MongoDB connection string
- [ ] Set up Redis (optional, for caching)
- [ ] Configure SMTP settings per tenant
- [ ] Set up SSL/TLS certificates
- [ ] Configure CORS properly
- [ ] Set up monitoring (Sentry, DataDog)
- [ ] Configure backups (MongoDB)
- [ ] Set up log aggregation
- [ ] Configure rate limiting
- [ ] Set up health checks

---

## 📊 Key Metrics & Monitoring

### Recommended Metrics

1. **Performance:**
   - API response times
   - Database query times
   - WebRTC connection success rate

2. **Business:**
   - Active tenants
   - Active users per tenant
   - Appointments per day
   - Revenue metrics

3. **Security:**
   - Failed login attempts
   - Unauthorized access attempts
   - PHI access logs

4. **System:**
   - Server CPU/Memory usage
   - Database connection pool usage
   - Socket.IO connection count

---

## 🔄 Development Workflow

### Local Development

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.local.example .env.local
# Edit .env.local

# 3. Set up database
# Ensure MongoDB is running

# 4. Create initial tenant and admin
npm run setup

# 5. Start development server
npm run dev
```

### Code Structure Rules

1. **API Routes:** Thin layer, delegate to services
2. **Services:** All business logic here
3. **Models:** Database schemas only
4. **Middleware:** Reusable authentication/authorization
5. **Utils:** Pure utility functions

### Testing (To Be Implemented)

- Unit tests for services
- Integration tests for API routes
- E2E tests for critical flows

---

## 📝 Notes & Considerations

### Current Limitations

1. **No Automated Testing:** Critical gap
2. **Logging:** Uses console.log (should use structured logging)
3. **Error Tracking:** No Sentry/DataDog integration
4. **Type Safety:** Migrated from TypeScript to JavaScript
5. **Documentation:** API documentation incomplete

### Future Enhancements

1. **Mobile App:** React Native app using same API
2. **Advanced Analytics:** Business intelligence dashboard
3. **AI Features:** Appointment scheduling optimization
4. **Telemedicine:** Group calls, screen sharing
5. **Integrations:** Lab systems, pharmacy networks

---

## 📚 Additional Resources

- **README.md:** Quick start guide
- **PROJECT_ASSESSMENT.md:** Detailed code review
- **CursorMD/:** Additional documentation
- **API Documentation:** (To be generated)

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Maintained By:** Development Team

