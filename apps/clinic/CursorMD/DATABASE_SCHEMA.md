# Database Schema Documentation

**Date:** January 2025  
**Status:** Complete Schema Reference

## Collections Overview

All collections include:
- `tenantId` - Multi-tenant isolation (required, indexed)
- `createdAt` - Creation timestamp (auto)
- `updatedAt` - Update timestamp (auto)
- `deletedAt` - Soft delete timestamp (null if active)

---

## Core Collections

### users
**Model:** `User`  
**Purpose:** System users (staff, doctors, admins, patients)

**Key Fields:**
- `email` (unique, indexed)
- `password` (hashed with bcrypt)
- `role` (enum: super_admin, clinic_admin, doctor, nurse, receptionist, etc.)
- `tenantId` (required except super_admin)
- `twoFactorEnabled`, `twoFactorSecret`

**Indexes:**
- `{ tenantId: 1, email: 1 }` (unique, sparse)
- `{ email: 1 }` (unique for super_admin)
- `{ tenantId: 1, role: 1 }`

---

### patients
**Model:** `Patient`  
**Purpose:** Patient records

**Key Fields:**
- `patientId` (unique per tenant, e.g., PAT-0001)
- `firstName`, `lastName`
- `dateOfBirth`, `gender`, `bloodGroup`
- `email`, `phone`
- `nationalId` (encrypted)
- `medicalHistory` (encrypted)
- `allergies` (encrypted)
- `currentMedications` (encrypted)
- `portalAccess.enabled`

**Indexes:**
- `{ tenantId: 1, patientId: 1 }` (unique)
- Text search on `firstName`, `lastName`, `patientId`, `phone`

---

### appointments
**Model:** `Appointment`  
**Purpose:** Appointment scheduling

**Key Fields:**
- `appointmentNumber` (unique per tenant)
- `patientId`, `doctorId`
- `appointmentDate`, `startTime`, `endTime`, `duration`
- `schedule` (object with date, startTime, endTime, duration)
- `status` (enum: scheduled, confirmed, arrived, in_queue, in_progress, completed, cancelled, no_show)
- `type` (enum: consultation, follow_up, emergency, etc.)
- `reminderScheduledAt`, `reminderSent`

**Indexes:**
- `{ tenantId: 1, appointmentDate: 1, status: 1 }`
- `{ tenantId: 1, doctorId: 1, appointmentDate: 1 }`
- `{ tenantId: 1, patientId: 1, appointmentDate: -1 }`
- `{ tenantId: 1, reminderScheduledAt: 1, reminderSent: 1, status: 1 }`

---

### prescriptions
**Model:** `Prescription`  
**Purpose:** E-prescriptions

**Key Fields:**
- `prescriptionNumber` (unique per tenant, e.g., RX-0001)
- `patientId`, `doctorId`
- `items` (array of drugs/labs/procedures)
- `status` (enum: draft, active, dispensed, cancelled, expired)
- `validFrom`, `validUntil`
- `refillsAllowed`, `refillsUsed`
- `diagnosis` (encrypted)
- `additionalInstructions` (encrypted)

**Indexes:**
- `{ tenantId: 1, prescriptionNumber: 1 }` (unique)
- `{ tenantId: 1, patientId: 1, createdAt: -1 }`
- `{ tenantId: 1, status: 1, validUntil: 1 }`
- `{ tenantId: 1, refillsAllowed: 1, refillsUsed: 1 }`

---

### invoices
**Model:** `Invoice`  
**Purpose:** Billing and invoicing

**Key Fields:**
- `invoiceNumber` (unique per tenant, e.g., INV-0001)
- `patientId`, `appointmentId`
- `invoiceDate`, `dueDate`
- `status` (enum: draft, pending, partial, paid, cancelled, refunded)
- `items` (array of invoice items)
- `subtotal`, `totalTax`, `totalAmount`, `balanceAmount`
- `taxBreakdown` (array)
- `currency`

**Indexes:**
- `{ tenantId: 1, invoiceNumber: 1 }` (unique)
- `{ tenantId: 1, patientId: 1, createdAt: -1 }`
- `{ tenantId: 1, status: 1, dueDate: 1 }`
- `{ tenantId: 1, invoiceDate: 1 }`

---

### payments
**Model:** `Payment`  
**Purpose:** Payment tracking

**Key Fields:**
- `paymentNumber` (unique per tenant)
- `invoiceId`, `patientId`
- `amount`, `currency`
- `paymentMethod` (enum: cash, card, upi, bank_transfer, etc.)
- `status` (enum: pending, completed, failed, refunded)
- `paymentDate`
- `transactionId`, `receiptNumber`

**Indexes:**
- `{ tenantId: 1, paymentNumber: 1 }` (unique)
- `{ tenantId: 1, invoiceId: 1 }`
- `{ tenantId: 1, patientId: 1, createdAt: -1 }`
- `{ tenantId: 1, paymentDate: 1 }`

---

### clinical_notes
**Model:** `ClinicalNote`  
**Purpose:** SOAP notes and clinical documentation

**Key Fields:**
- `patientId`, `doctorId`, `appointmentId`
- `type` (enum: soap, progress, consultation, procedure, follow_up)
- `soap` (object with subjective, objective, assessment, plan)
- `vitalSigns` (object)
- `diagnosis`, `icd10Codes`
- `version`, `previousVersionId`
- `editedAt`, `editedBy`

**Indexes:**
- `{ tenantId: 1, patientId: 1, createdAt: -1 }`
- `{ tenantId: 1, doctorId: 1, createdAt: -1 }`
- `{ tenantId: 1, appointmentId: 1 }`

---

### lab_tests
**Model:** `LabTest`  
**Purpose:** Lab test catalog

**Key Fields:**
- `testCode` (unique per tenant)
- `name`, `description`
- `category`, `subcategory`
- `parameters` (array with name, unit, referenceRange)
- `pricing` (object with costPrice, sellingPrice)
- `turnaroundTime` (hours)
- `isActive`

**Indexes:**
- `{ tenantId: 1, testCode: 1 }` (unique)
- `{ tenantId: 1, category: 1 }`

---

### lab_orders
**Model:** `LabOrder`  
**Purpose:** Lab test orders

**Key Fields:**
- `orderNumber` (unique, e.g., LAB-0001)
- `patientId`, `doctorId`
- `tests` (array of test orders)
- `sample` (object with type, collectedAt, barcode)
- `status` (enum: ordered, collected, processing, completed, cancelled)
- `orderedAt`, `expectedCompletion`

**Indexes:**
- `{ tenantId: 1, orderNumber: 1 }` (unique)
- `{ tenantId: 1, patientId: 1, orderedAt: -1 }`
- `{ tenantId: 1, status: 1, orderedAt: -1 }`

---

### lab_results
**Model:** `LabResult`  
**Purpose:** Lab test results

**Key Fields:**
- `orderId`, `patientId`, `testId`
- `results` (array with parameter, value, unit, referenceRange, flag)
- `interpretation`, `remarks`
- `verifiedBy`, `verifiedAt`
- `status` (enum: draft, verified, delivered)
- `reportedAt`

**Indexes:**
- `{ tenantId: 1, orderId: 1 }`
- `{ tenantId: 1, patientId: 1, reportedAt: -1 }`
- `{ tenantId: 1, status: 1 }`

---

### inventory_items
**Model:** `InventoryItem`  
**Purpose:** Medicine and supply inventory

**Key Fields:**
- `name`, `code`
- `type` (enum: medicine, medical_supply, equipment, consumable, other)
- `totalQuantity`, `availableQuantity`, `reservedQuantity`
- `batches` (array with batchNumber, expiryDate, quantity)
- `costPrice`, `sellingPrice`, `currency`
- `lowStockThreshold`, `reorderPoint`, `reorderQuantity`

**Indexes:**
- `{ tenantId: 1, code: 1 }` (unique, sparse)
- `{ tenantId: 1, type: 1 }`

---

### stock_batches
**Model:** `StockBatch`  
**Purpose:** Medicine batch tracking

**Key Fields:**
- `medicineId`
- `batchNumber` (unique per tenant)
- `quantity` (object with received, current, sold, returned)
- `pricing` (object with purchasePrice, sellingPrice)
- `dates` (object with manufactured, expiry, received)
- `status` (enum: active, expired, depleted)

**Indexes:**
- `{ tenantId: 1, medicineId: 1, status: 1 }`
- `{ tenantId: 1, 'dates.expiry': 1 }`
- `{ tenantId: 1, batchNumber: 1 }` (unique)

---

### stock_transactions
**Model:** `StockTransaction`  
**Purpose:** Stock movement tracking

**Key Fields:**
- `transactionNumber` (unique, e.g., STX-0001)
- `medicineId`, `batchId`, `inventoryItemId`
- `type` (enum: purchase, sale, return, adjustment, transfer, waste)
- `quantity`
- `unitPrice`, `totalAmount`, `currency`
- `reference` (object with type, id, number)
- `fromLocation`, `toLocation`

**Indexes:**
- `{ tenantId: 1, type: 1, createdAt: -1 }`
- `{ tenantId: 1, medicineId: 1 }`

---

### insurance_claims
**Model:** `InsuranceClaim`  
**Purpose:** Insurance claim management

**Key Fields:**
- `claimNumber` (unique per tenant)
- `invoiceId`, `patientId`
- `insuranceProvider`, `policyNumber`
- `claimAmount`
- `status` (enum: draft, submitted, approved, denied, etc.)
- `submittedAt`, `approvedAt`, `deniedAt`
- `eob` (Explanation of Benefits object)

**Indexes:**
- `{ tenantId: 1, claimNumber: 1 }` (unique)
- `{ tenantId: 1, patientId: 1, createdAt: -1 }`
- `{ tenantId: 1, status: 1 }`

---

### notifications
**Model:** `Notification`  
**Purpose:** System notifications

**Key Fields:**
- `userId`, `tenantId`
- `type` (enum: appointment, prescription, payment, lab_result, system)
- `title`, `message`
- `channels` (object with inApp, email, sms, whatsapp status)
- `priority` (enum: low, medium, high, urgent)
- `expiresAt`

**Indexes:**
- `{ tenantId: 1, userId: 1, createdAt: -1 }`
- `{ userId: 1, 'channels.inApp.read': 1, createdAt: -1 }`
- TTL index on `expiresAt`

---

### whatsapp_messages
**Model:** `WhatsAppMessage`  
**Purpose:** WhatsApp message logging

**Key Fields:**
- `tenantId`, `patientId`, `userId`
- `direction` (enum: inbound, outbound)
- `from`, `to`
- `messageBody`, `messageSid`
- `status` (enum: queued, sent, delivered, read, failed)
- `messageType` (enum: text, template, media, etc.)
- `sentAt`, `deliveredAt`, `readAt`

**Indexes:**
- `{ tenantId: 1, patientId: 1, sentAt: -1 }`
- `{ tenantId: 1, from: 1, sentAt: -1 }`
- `{ messageSid: 1 }` (unique, sparse)

---

### audit_logs
**Model:** `AuditLog`  
**Purpose:** Compliance audit trail

**Key Fields:**
- `tenantId`, `userId`
- `resource`, `resourceId`
- `action` (enum: CREATE, READ, UPDATE, DELETE, ACCESS)
- `before`, `after` (object snapshots)
- `metadata` (additional context)
- `ipAddress`, `userAgent`
- `timestamp`

**Indexes:**
- `{ tenantId: 1, timestamp: -1 }`
- `{ userId: 1, timestamp: -1 }`
- `{ resource: 1, resourceId: 1, timestamp: -1 }`

---

## Data Relationships

```
Tenant
  ├── Users (staff, doctors, etc.)
  ├── Patients
  │   ├── Appointments
  │   │   └── Clinical Notes
  │   ├── Prescriptions
  │   ├── Invoices
  │   │   └── Payments
  │   ├── Lab Orders
  │   │   └── Lab Results
  │   └── Insurance Claims
  ├── Doctors
  │   └── Departments
  ├── Inventory Items
  │   └── Stock Batches
  └── Notifications
```

---

## Indexing Strategy

### Compound Indexes
Used for common query patterns:
- `{ tenantId: 1, field: 1 }` - Tenant + field filtering
- `{ tenantId: 1, status: 1, date: 1 }` - Multi-field filtering
- `{ tenantId: 1, patientId: 1, createdAt: -1 }` - Patient history

### Text Indexes
Used for search:
- Patient: `firstName`, `lastName`, `patientId`, `phone`
- Can be extended to other collections as needed

### Unique Indexes
- `{ tenantId: 1, code: 1 }` - Unique codes per tenant
- `{ tenantId: 1, email: 1 }` - Unique emails per tenant

---

## Data Retention

- **Audit Logs:** 6 years (HIPAA requirement)
- **Medical Records:** 7 years minimum (varies by region)
- **Financial Records:** 7 years
- **Notifications:** TTL index (auto-delete after expiry)

---

## Encryption

**PHI Fields Encrypted:**
- Patient: `nationalId`, `medicalHistory`, `allergies`, `currentMedications`
- Prescription: `diagnosis`, `additionalInstructions`, item `instructions`
- Clinical Note: SOAP fields, `diagnosis`

**Encryption Method:** AES-256-GCM  
**Key Management:** Environment variable `ENCRYPTION_KEY`

---

## Multi-Tenancy

All collections include `tenantId`:
- Queries filtered by `tenantId` using `withTenant()` helper
- Super admin can access all tenants (tenantId: null)
- Compound indexes include `tenantId` as first field

---

## Migration Notes

When adding new fields:
1. Add to schema with default values
2. Create migration script if needed
3. Update indexes
4. Update validation schemas
5. Update API documentation
