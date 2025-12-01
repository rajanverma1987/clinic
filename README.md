# Clinic Management SaaS

Global-ready, multi-tenant clinic management system with HIPAA/GDPR compliance.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB 6+
- Redis (optional, for caching)

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your configuration:
```env
MONGODB_URI=mongodb://localhost:27017/clinic-tool
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
ENCRYPTION_KEY=your-32-byte-hex-encryption-key
```

3. **Set up initial tenant and super admin:**
```bash
npm run setup
```

This will prompt you to create:
- A tenant (clinic)
- A super admin user

4. **Start development server:**
```bash
npm run dev
```

5. **Test the health endpoint:**
```bash
curl http://localhost:3000/api/health
```

6. **Test authentication:**
```bash
# Register a user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@clinic.com",
    "password": "securepass123",
    "firstName": "John",
    "lastName": "Doe",
    "role": "doctor",
    "tenantId": "<tenant-id-from-setup>"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@clinic.com",
    "password": "securepass123"
  }'
```

## 📁 Project Structure

```
clinic-tool/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   └── page.tsx           # Home page
├── lib/                   # Core utilities
│   ├── auth/             # JWT authentication
│   ├── audit/            # Audit logging
│   ├── db/               # Database connection & helpers
│   ├── encryption/       # PHI encryption utilities
│   └── utils/            # API response, pagination
├── middleware/           # Auth, tenant validation, RBAC
├── models/               # Mongoose models
│   ├── Tenant.ts        # Tenant model
│   └── User.ts          # User model
└── PROJECT_PLAN.md      # Detailed project plan
```

## ✅ Phase 1-8 Complete: Foundation + Auth + Patient + Appointments + Clinical Notes + Prescriptions + Billing + Inventory

### What's Built

1. **Next.js Setup**
   - TypeScript configuration
   - Tailwind CSS
   - ESLint

2. **Database Layer**
   - MongoDB connection with connection pooling
   - Tenant isolation helpers
   - Base models (Tenant, User)

3. **Authentication** ✅
   - JWT access & refresh tokens
   - Password hashing with bcrypt
   - Auth middleware
   - **API Endpoints:**
     - `POST /api/auth/register` - Register new user
     - `POST /api/auth/login` - Login and get tokens
     - `POST /api/auth/refresh` - Refresh access token
     - `GET /api/auth/me` - Get current user (protected)
     - `POST /api/auth/logout` - Logout user

4. **Security & Compliance**
   - PHI field-level encryption (AES-256-GCM)
   - Audit logging framework
   - Tenant validation middleware
   - Role-based access control (RBAC)

5. **Utilities**
   - Standardized API responses
   - Pagination helpers
   - Error handling

### Key Features

- ✅ Multi-tenant architecture (tenantId on all collections)
- ✅ Field-level encryption for PHI
- ✅ Audit logging for compliance
- ✅ JWT authentication with refresh tokens
- ✅ RBAC middleware
- ✅ Tenant isolation enforcement

## 🔐 Security Features

- **Encryption**: AES-256-GCM for PHI fields
- **Authentication**: JWT with rotation
- **Access Control**: RBAC + ABAC
- **Audit Logs**: Immutable logs for all operations
- **Tenant Isolation**: All queries filtered by tenantId

6. **Patient Module** ✅
   - Complete CRUD operations
   - PHI field encryption (medicalHistory, allergies, medications, nationalId)
   - Auto-generated patient IDs (PAT-0001, PAT-0002, etc.)
   - Pagination and filtering
   - Soft delete support

7. **Appointments Module** ✅
   - Complete CRUD operations
   - Multiple statuses (scheduled, confirmed, arrived, in_queue, in_progress, completed, cancelled, no_show)
   - Time slot conflict detection
   - Status change tracking with timestamps
   - Reminder scheduling (24h before by default)
   - Background reminder processor

8. **Clinical Notes Module** ✅
   - SOAP note structure (Subjective, Objective, Assessment, Plan)
   - Multiple note types (SOAP, progress, consultation, procedure, follow-up)
   - Note templates (customizable per doctor/specialty)
   - Versioning system (full history tracking)
   - PHI encryption (SOAP fields, diagnosis, content)
   - Vital signs tracking
   - ICD-10 and SNOMED CT code support
   - Attachments support

9. **Prescriptions Module** ✅
   - Drug database with regional availability
   - Multiple prescription statuses (draft, active, dispensed, cancelled, expired)
   - Auto-generated prescription numbers (RX-0001, RX-0002...)
   - Region-specific prescription formatting
   - Refill tracking
   - E-signature support (where allowed by region)
   - PHI encryption (diagnosis, instructions)
   - Drug validation and regional availability checks

10. **Billing Module** ✅
   - Invoice creation with itemized billing
   - Region-specific tax engine (GST, VAT, Sales Tax)
   - Multi-currency support (all amounts in minor units)
   - Payment tracking and reconciliation
   - Discount support (percentage or fixed)
   - Insurance coverage tracking
   - Auto-generated invoice numbers (INV-0001, INV-0002...)
   - Payment status management (draft, pending, partial, paid, cancelled)

11. **Inventory Module** ✅
   - Medicine and medical supply stock management
   - Batch/expiry date tracking
   - Auto low-stock alerts
   - Supplier management
   - Stock transaction tracking (purchase, sale, adjustment, return, expired, damaged)
   - Multi-currency pricing
   - Reorder point and reorder quantity management
   - **API Endpoints:**
     - `GET /api/inventory/items` - List items (with filters, low stock, expired)
     - `GET /api/inventory/items/:id` - Get single item
     - `POST /api/inventory/items` - Create item
     - `PUT /api/inventory/items/:id` - Update item
     - `DELETE /api/inventory/items/:id` - Soft delete
     - `POST /api/inventory/transactions` - Create stock transaction
     - `GET /api/inventory/suppliers` - List suppliers
     - `POST /api/inventory/suppliers` - Create supplier

## 📋 Next Steps

1. ~~Patient Module (CRUD + attachments)~~ ✅
2. ~~Appointments Module (with reminder queue)~~ ✅
3. ~~Clinical Notes Module (SOAP notes)~~ ✅
4. ~~Prescriptions Module (region-specific)~~ ✅
5. ~~Billing Module (invoices + tax engine)~~ ✅
6. ~~Inventory Module~~ ✅
7. Queue/Walk-in Module (real-time)
8. Reporting Module

## 🛠️ Development

```bash
# Development
npm run dev

# Build
npm run build

# Production
npm start

# Lint
npm run lint
```

## 📝 API Response Format

All API responses follow this structure:

```json
{
  "success": true,
  "data": { ... }
}
```

Or on error:

```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "code": "ERROR_CODE"
  }
}
```

## 🔒 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret for access tokens | Yes |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | Yes |
| `ENCRYPTION_KEY` | 32-byte hex key for PHI encryption | Yes |
| `REDIS_URL` | Redis connection (optional) | No |

## 📚 Documentation

- **`PROJECT_PLAN.md`** - Detailed architecture and roadmap
- **`API_DOCUMENTATION.md`** - Complete API reference with examples

## 🔑 API Endpoints

### Authentication

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/auth/register` | POST | Register new user | No |
| `/api/auth/login` | POST | Login and get tokens | No |
| `/api/auth/refresh` | POST | Refresh access token | No |
| `/api/auth/me` | GET | Get current user | Yes |
| `/api/auth/logout` | POST | Logout user | No |

### Patients

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/patients` | GET | List patients (paginated) | Yes |
| `/api/patients` | POST | Create patient | Yes |
| `/api/patients/:id` | GET | Get patient by ID | Yes |
| `/api/patients/:id` | PUT | Update patient | Yes |
| `/api/patients/:id` | DELETE | Soft delete patient | Yes |

**Query Parameters for GET /api/patients:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `search` - Search in name, patientId, phone, email
- `gender` - Filter by gender
- `bloodGroup` - Filter by blood group
- `isActive` - Filter by active status

### Appointments

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/appointments` | GET | List appointments (paginated) | Yes |
| `/api/appointments` | POST | Create appointment | Yes |
| `/api/appointments/:id` | GET | Get appointment by ID | Yes |
| `/api/appointments/:id` | PUT | Update appointment | Yes |
| `/api/appointments/:id/status` | PUT | Change appointment status | Yes |
| `/api/appointments/:id` | DELETE | Soft delete appointment | Yes |
| `/api/cron/reminders` | POST | Process reminders (cron) | No* |

**Query Parameters for GET /api/appointments:**
- `page`, `limit` - Pagination
- `patientId` - Filter by patient
- `doctorId` - Filter by doctor
- `status` - Filter by status
- `type` - Filter by type
- `date` - Filter by specific date
- `startDate`, `endDate` - Date range filter

*Cron endpoint should be protected in production

### Clinical Notes

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/clinical-notes` | GET | List clinical notes (paginated) | Yes |
| `/api/clinical-notes` | POST | Create clinical note | Yes |
| `/api/clinical-notes/:id` | GET | Get clinical note by ID | Yes |
| `/api/clinical-notes/:id` | PUT | Update note (creates new version) | Yes |
| `/api/clinical-notes/:id/versions` | GET | Get version history | Yes |
| `/api/clinical-notes/:id` | DELETE | Soft delete note | Yes |

**Query Parameters for GET /api/clinical-notes:**
- `page`, `limit` - Pagination
- `patientId` - Filter by patient
- `doctorId` - Filter by doctor
- `appointmentId` - Filter by appointment
- `type` - Filter by note type (soap/progress/consultation/procedure/follow_up)
- `startDate`, `endDate` - Date range filter

### Prescriptions

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/prescriptions` | GET | List prescriptions (paginated) | Yes |
| `/api/prescriptions` | POST | Create prescription | Yes |
| `/api/prescriptions/:id` | GET | Get prescription by ID | Yes |
| `/api/prescriptions/:id` | PUT | Update prescription | Yes |
| `/api/prescriptions/:id/activate` | POST | Activate prescription | Yes |
| `/api/prescriptions/:id/dispense` | POST | Dispense prescription | Yes |
| `/api/prescriptions/:id` | DELETE | Soft delete prescription | Yes |

**Query Parameters for GET /api/prescriptions:**
- `page`, `limit` - Pagination
- `patientId` - Filter by patient
- `doctorId` - Filter by doctor
- `status` - Filter by status (draft/active/dispensed/cancelled/expired)
- `startDate`, `endDate` - Date range filter

### Billing

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/invoices` | GET | List invoices (paginated) | Yes |
| `/api/invoices` | POST | Create invoice | Yes |
| `/api/invoices/:id` | GET | Get invoice by ID | Yes |
| `/api/invoices/:id` | PUT | Update invoice | Yes |
| `/api/invoices/:id` | DELETE | Soft delete invoice | Yes |
| `/api/payments` | GET | List payments (paginated) | Yes |
| `/api/payments` | POST | Create payment | Yes |

**Query Parameters for GET /api/invoices:**
- `page`, `limit` - Pagination
- `patientId` - Filter by patient
- `status` - Filter by status (draft/pending/partial/paid/cancelled/refunded)
- `startDate`, `endDate` - Date range filter

**Query Parameters for GET /api/payments:**
- `page`, `limit` - Pagination
- `invoiceId` - Filter by invoice
- `patientId` - Filter by patient
- `status` - Filter by status
- `startDate`, `endDate` - Date range filter

### Inventory

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/inventory/items` | GET | List items (with filters) | Yes |
| `/api/inventory/items?lowStock=true` | GET | Get low stock items | Yes |
| `/api/inventory/items?expired=true` | GET | Get expired items | Yes |
| `/api/inventory/items` | POST | Create inventory item | Yes |
| `/api/inventory/items/:id` | GET | Get item by ID | Yes |
| `/api/inventory/items/:id` | PUT | Update item | Yes |
| `/api/inventory/items/:id` | DELETE | Soft delete item | Yes |
| `/api/inventory/transactions` | POST | Create stock transaction | Yes |
| `/api/inventory/suppliers` | GET | List suppliers | Yes |
| `/api/inventory/suppliers` | POST | Create supplier | Yes |

**Query Parameters for GET /api/inventory/items:**
- `page`, `limit` - Pagination
- `search` - Search in name, code, generic name, brand name
- `type` - Filter by type (medicine/medical_supply/equipment/consumable/other)
- `lowStock` - Filter low stock items
- `expired` - Filter items with expired batches
- `isActive` - Filter by active status

See `API_DOCUMENTATION.md` for detailed request/response examples.

