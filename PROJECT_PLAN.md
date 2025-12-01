# Clinic Management SaaS - Project Plan

## Executive Summary

We are building a **global-ready, multi-tenant clinic management SaaS** that supports:
- **Multi-tenant architecture** (each clinic = one tenant)
- **Multi-region compliance** (HIPAA, GDPR, PIPEDA, Privacy Act, Middle East/India regulations)
- **API-first design** for future mobile applications
- **Regional customization** (prescriptions, invoices, tax, data residency)

---

## 1. Technical Stack & Architecture

### 1.1 Technology Choices
- **Backend**: Node.js (Next.js API routes)
- **Database**: MongoDB (with Mongoose)
- **Frontend**: Next.js (React with Server Components)
- **Caching**: Redis (tokens, rate limits, caching)
- **Storage**: S3-compatible encrypted storage for medical files
- **Real-time**: WebSocket/SSE for queue management

### 1.2 Core Architecture Principles

#### Multi-Tenancy
- **Every MongoDB collection must include `tenantId`**
- **All queries must filter by `tenantId`**
- Each clinic = one tenant
- Users belong to a tenant and have roles
- Configuration stored in `tenant_settings` table (currency, locale, timezone, tax rules)

#### Service Layer Pattern
- **Clean service-layer architecture**
- API routes stay thin (delegate to services)
- No business logic inside UI components
- All modules API-first for mobile support

#### Data Handling
- All timestamps stored as **UTC**
- Money stored in **minor units (integer)**
- Use `timestamps: true` on all collections
- Implement soft delete where laws allow

---

## 2. Compliance & Security Framework

### 2.1 Data Protection

#### Encryption
- **AES-256 at rest**, TLS 1.3 in transit
- **Field-level encryption** for PHI (diagnosis, notes, prescriptions)
- Use encryption helpers for PHI fields before saving to DB

#### Data Residency
- Per-region data residency (EU, US, APAC, India, Middle East)
- Data-retention policies (delete/archive after X years by region)
- Daily encrypted backups stored in same region

#### Access Control
- **RBAC + ABAC** (Role-Based + Attribute-Based Access Control)
- Device/IP tracking
- Auto session expiry
- Forced logout on password change
- Per-role visibility rules for PHI
- Offline export permissions with audit trail

#### Audit & Monitoring
- **Immutable audit logs** for every read/write
- Exportable HIPAA-style access reports
- Intrusion detection + anomaly alerts
- Rate limiting + bot detection
- External logging to SIEM-compatible system

### 2.2 Region-Specific Compliance

#### United States (HIPAA)
- Signed BAA with hosting
- PHI access logs retained for 6 years
- Emergency access workflow
- Secure messaging (no raw PHI in SMS/Email)
- Automatic breach-notification generator

#### Europe (GDPR)
- Lawful basis (consent/legitimate interest)
- Data portability in machine-readable format
- Data erasure workflows
- Country-level DPA template
- Cookie and tracking compliance

#### Other Regions
- **Canada (PIPEDA)**: Breach notification, clear data-use purposes
- **Australia**: Local storage for clinical notes, consent for data sharing
- **Middle East/India**: Data-localization options, explicit consent, e-signature compliance

### 2.3 Security Implementation Requirements

#### API Security
- All API routes behind authentication
- JWT with rotation
- Refresh token stored HTTP-only
- Always validate input using JOI/Zod
- Never return raw MongoDB errors
- Always wrap responses as `{ success, data, error }`
- Every sensitive route must enforce auth + role checks
- Apply rate limiting for public and auth routes
- **No PHI in URL params, logs, or notifications**

#### Data Security
- Always sanitize input to avoid injection
- Encrypt PHI fields before saving to DB
- Implement audit logs on create/update/delete and sensitive read
- No PHI in logs, SMS, WhatsApp, or email notifications
- Implement consent tracking for patient data processing

---

## 3. Core Modules to Build

### 3.1 Patient Module
**Features:**
- CRUD patients
- Fields: demographics, contact info, identifiers
- Attachments allowed (reports, files)
- Full audit tracking
- Paginated list + filters

**Implementation:**
- Auto-generate REST endpoints
- Validation schemas (JOI/Zod)
- Pagination helpers
- All queries filtered by `tenantId`

### 3.2 Appointments Module
**Features:**
- Booking, rescheduling, cancellation
- Multiple statuses: scheduled, arrived, in_queue, completed, cancelled
- Reminder scheduler queues messages

**Implementation:**
- Event-driven logic for reminders
- Background worker integration
- Automated reminders (SMS/Email/WhatsApp) - no PHI in notifications

### 3.3 Queue / Walk-in Module
**Features:**
- Real-time queue management
- Live wait times
- Clinic-level configuration for display order

**Implementation:**
- WebSocket or SSE for updates
- Reusable Socket manager
- Publish/subscribe events

### 3.4 Clinical Notes Module
**Features:**
- SOAP note structure
- Custom templates per doctor/specialty
- Versioning of notes
- Attachment support (PDF, images, lab files)

**Implementation:**
- Modular components for text sections
- Dynamic templates
- Field-level encryption for PHI content

### 3.5 Prescriptions Module
**Features:**
- Drug list + frequencies + durations
- Printable + exportable
- Country-specific layout (dynamic)
- E-prescription signature rules

**Implementation:**
- Template renderer that takes `country_code` and prescription schema
- Region-specific prescription formats
- Strategy pattern for region-specific implementations

### 3.6 Billing Module
**Features:**
- Invoice creation
- Items: consultation, procedure, medication
- Localized tax logic (GST, VAT)
- Multi-currency support
- OPD billing, procedure billing
- Discounts and insurance fields
- UPI/card payments (PCI-DSS compliant gateways)
- Daily settlement

**Implementation:**
- Abstract tax engine per country
- Keep invoice model normalized
- Itemized invoices with legal formatting
- Country-specific tax configuration

### 3.7 Inventory Module
**Features:**
- Medicine stock management
- Batch/expiry tracking
- Auto low-stock alerts
- Supplier management

**Implementation:**
- Scheduled job daily to evaluate stock thresholds
- Use indexes for heavy read operations

### 3.8 Staff / Roles Module
**Features:**
- Role-based access control (RBAC)
- Attribute-based rules (doctor can only see own patients)
- Attendance tracking
- Task list

**Implementation:**
- Centralized middleware for permission checks
- Resource scopes
- Access-control middleware for RBAC and ABAC

### 3.9 Telemedicine Module
**Features:**
- Video calls
- Secure chat
- Disclaimers per region

**Implementation:**
- API with ephemeral tokens
- Short-lived URLs
- Session logs (no PHI in transcripts)

### 3.10 Reporting Module
**Features:**
- Revenue analytics
- Recurrence reports
- Patient count
- Expense tracking
- Inventory predictions
- Export CSV/PDF

**Implementation:**
- Reporting service wrapper with query builder patterns
- Use worker queues for long tasks
- Pagination for all list endpoints

### 3.11 Marketing + Engagement Module
**Features:**
- Post-visit feedback
- Automated follow-ups
- Broadcast campaigns (regionally compliant)

**Implementation:**
- Background jobs or cron for sending reminders
- Never include PHI in notifications
- Store logs of delivery attempts in `notificationLogs`
- Allow clinics to choose communication channels

### 3.12 Multi-location Module
**Features:**
- Shared patient profiles
- Centralized reports
- Clinic-level permissions

**Implementation:**
- Namespace all tenant and clinic queries to avoid accidental leakage
- Shared master admin panel
- Clinic admins limited to tenant scope

---

## 4. Internationalization (i18n)

### 4.1 Language
- String dictionaries
- Server responses localized using tenant locale
- Use i18n dictionaries for all UI text

### 4.2 Currency
- `currency_code` stored in `tenant_settings`
- Money always stored in minor units (integer)
- Never hardcode currency

### 4.3 Timezones
- All timestamps stored as UTC
- UI converts based on tenant timezone
- Never hardcode timezone

### 4.4 Country Variants
- Prescription formats (region-specific)
- Invoice formats (region-specific)
- TTL for records (region-specific)
- Required compliance fields (region-specific)
- Use strategy pattern for region-specific implementations

---

## 5. Medical Content Standardization

### 5.1 Coding Standards
- **ICD-10** diagnosis codes
- **SNOMED CT** for clinical terminology
- **LOINC** for labs (optional)
- **FHIR-ready architecture** for future integrations

### 5.2 Prescription Rules
- Country-specific prescription layouts
- Legally required fields per region
- E-prescription signature rules
- Drug interactions lookup (future module)

---

## 6. Frontend Architecture

### 6.1 Component Structure
- **Server components** for heavy data pages
- **Client components** only where required
- Use React Query or SWR for client-side fetching
- Reusable form and table components
- Avoid inline logic inside components - move to hooks/services

### 6.2 UI Features
- Multi-language (i18n)
- Offline notes draft mode
- Consent screen at onboarding
- Patient privacy center
- Expiring share links for reports
- Role-based visibility for sensitive notes
- Localized legal pages

---

## 7. Performance & Scalability

### 7.1 Database Optimization
- Use indexes for heavy read modules (appointments, billing, inventory)
- Use `lean()` in MongoDB queries when returning plain objects
- Avoid N+1 queries - prefer aggregated lookups
- Use pagination for all list endpoints

### 7.2 Caching Strategy
- Cache read-heavy endpoints with Redis or in-memory caching
- Use Redis for tokens & rate limits

### 7.3 Background Processing
- Use worker queues for long tasks (reports, reminders)
- Use background jobs or cron for sending reminders
- Event-based architecture for notifications

### 7.4 High Availability (Future)
- Multi-zone deployment
- Auto-scaling API layer
- Read replicas for high-traffic clinics
- RPO ≤ 15 min, RTO ≤ 1 hour

---

## 8. Development Standards

### 8.1 Code Organization
- Use async/await consistently
- Clean service-layer architecture
- API routes stay thin
- No business logic inside UI components

### 8.2 Error Handling
- Always validate input using JOI/Zod
- Never return raw MongoDB errors
- Always wrap responses as `{ success, data, error }`

### 8.3 Database Standards
- Use Mongoose or native Mongo driver with schemas
- All schemas require `tenantId`
- Use `timestamps: true` for all collections
- Store all dates as UTC
- Use indexes for heavy read modules

### 8.4 Future-Proofing
- Build modules with extension points for labs, radiology, pharmacy
- Structure services so they can be converted to microservices later
- Keep region-specific logic isolated behind strategy interfaces
- All new modules must support multi-clinic and multi-region out of the box

---

## 9. Required Middleware & Utilities

### 9.1 Audit Middleware
- `audit_write(resource, resource_id, user)`
- `audit_read(resource, resource_id, user)`
- Immutable audit logs for every read/write

### 9.2 Encryption Utilities
- `encryptField()` / `decryptField()` handlers
- Field-level encryption for PHI

### 9.3 Access Control
- `tenant_access_validation` middleware
- Centralized permission checks
- Resource scopes

### 9.4 Compliance Hooks
- Data-export endpoint per patient
- Delete/anonymize endpoint
- Consent record storage
- Configurable retention schedule

---

## 10. Implementation Roadmap

### Phase 1: Foundation
1. Set up Next.js project structure
2. MongoDB connection with tenant isolation
3. Authentication system (JWT with rotation)
4. Tenant settings model
5. Basic audit logging middleware
6. Encryption utilities for PHI

### Phase 2: Core Modules
1. Patient Module (CRUD + attachments)
2. Staff/Roles Module (RBAC + ABAC)
3. Appointments Module (with reminder queue)
4. Queue/Walk-in Module (real-time)

### Phase 3: Clinical Features
1. Clinical Notes Module (SOAP + templates)
2. Prescriptions Module (region-specific)
3. Lab Orders Module

### Phase 4: Financial
1. Billing Module (invoices + tax engine)
2. Payment integration (PCI-DSS compliant)
3. Inventory Module

### Phase 5: Advanced Features
1. Reporting Module
2. Telemedicine Module
3. Marketing/Engagement Module
4. Multi-location support

### Phase 6: Compliance & Polish
1. Region-specific compliance workflows
2. Data export/erasure endpoints
3. Consent tracking
4. Legal document templates
5. Performance optimization

---

## 11. Legal Documents Required

- Privacy Policy
- Terms of Service
- DPA (Data Processing Agreement)
- HIPAA BAA (for US clients)
- GDPR-compliant cookie policy
- Incident response policy
- Data retention policy
- Medical disclaimer per country

---

## 12. Key Success Criteria

✅ **Security**: All PHI encrypted, audit logs complete, no data leakage  
✅ **Compliance**: HIPAA, GDPR, and region-specific requirements met  
✅ **Multi-tenancy**: Complete tenant isolation, no cross-tenant data access  
✅ **Performance**: Fast queries with indexes, caching, pagination  
✅ **Scalability**: API-first design, ready for mobile apps  
✅ **Internationalization**: Multi-currency, multi-timezone, multi-language  
✅ **Regional Customization**: Prescriptions and invoices adapt to country rules  

---

## Next Steps

1. Review and approve this project plan
2. Set up development environment
3. Initialize Next.js project with MongoDB
4. Begin Phase 1 implementation

