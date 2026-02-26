# Cursor AI — Super Admin Panel: Full Implementation Prompt

## Project Context

You are building the **Company Super Admin Panel** for a **multi-tenant clinic SaaS platform**.

- Internal tool only — NOT patient-facing
- NOT a marketplace
- Manages clinic infrastructure, subscriptions, access, and platform health
- Stack: React + TypeScript + TailwindCSS + shadcn/ui (or adapt to project stack)
- All data is **tenant-scoped** — never expose cross-tenant or patient-level data
- Backend: REST or tRPC (adapt to existing project)

---

## Absolute Rules (Enforce at Every Layer)

### Super Admin CAN:

- Manage clinics (create, activate, suspend, delete)
- Control subscriptions and billing
- Manage platform user access (not clinical users)
- Enable/disable feature modules per clinic
- Control deployments and templates
- Enter support mode (read-only view of clinic config)
- Trigger backups and restores (with approval gates)
- Manage internal roles and permissions
- View audit logs and analytics

### Super Admin CANNOT (hard-block at UI + API):

- Edit, view, or modify consultations
- Edit, view, or modify prescriptions
- Modify clinical records of any kind
- Access patient PII directly
- Perform irreversible operations without confirmation gates

### Data Rules:

- All queries must include `tenantId` scope
- Missing/null values render as `0` — never `NaN`, `undefined`, or `null`
- Dates must display in human-readable format with timezone
- All destructive operations require a typed confirmation dialog

---

## Architecture Requirements

### Routing Structure

```
/super-admin
  /overview
  /clinics
    /list
    /[clinicId]/profile
    /[clinicId]/users
    /[clinicId]/storage
  /subscriptions
    /plans
    /billing
    /trials
  /users
    /list
    /access-logs
  /features
    /modules
    /plan-mapping
  /deployment
    /templates
    /module-assignment
  /analytics
    /usage
    /adoption
  /audit
    /activity-logs
    /access-overrides
  /support
    /enter-clinic
  /data
    /backup
    /restore
  /roles
    /list
    /permissions
  /rollout
    /beta
  /security
    /2fa
    /ip-restrictions
  /emergency
    /suspend
    /lock-access
  /notifications
    /alerts
```

### Auth Guard

- All routes must be wrapped in `<SuperAdminGuard>` — verify role = `SUPER_ADMIN` on every render and API call
- On role mismatch → redirect to `/unauthorized`
- Session timeout after 30 minutes of inactivity
- All support mode sessions must be time-limited (max 60 minutes) and auto-logged

---

## Section 1: Overview Dashboard

### Layout

- Top row: 8 summary cards (2 rows of 4 on desktop, stack on mobile)
- Middle: Platform Alerts panel
- Bottom: Risk Monitoring panel

### Summary Cards (all default to `0`)

| Card                       | Metric                                 |
| -------------------------- | -------------------------------------- |
| Total Active Clinics       | count where status = ACTIVE            |
| Clinics in Trial           | count where status = TRIAL             |
| Expired Clinics            | count where status = EXPIRED           |
| Active Subscriptions       | count where subscription.active = true |
| Total Users Across Clinics | sum of all clinic user counts          |
| Total Storage Usage        | formatted as GB/TB                     |
| Monthly Recurring Revenue  | formatted as currency                  |
| System Health              | badge: HEALTHY / DEGRADED / CRITICAL   |

**Implementation:**

```typescript
// Fallback pattern — use everywhere
const safeValue = (val: number | null | undefined) => val ?? 0;
const safeFormatCurrency = (val: number | null | undefined) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val ?? 0);
```

### Platform Alerts

Each alert must:

- Show clinic name, alert type, timestamp
- Be clickable → navigates to `/clinics/[clinicId]/profile`
- Be dismissible (dismissed state persists per admin session)

Alert types:

- `TRIAL_ENDING_SOON` — trial ends within 7 days
- `PAYMENT_FAILURE` — last payment failed
- `STORAGE_NEAR_LIMIT` — storage > 85% of quota
- `INACTIVE_CLINIC` — no activity for 30+ days

### Risk Monitoring

- Expiring subscriptions (next 30 days)
- Active security alerts
- Suspended clinics count
- Audit anomalies (unusual login patterns, bulk data exports)

---

## Section 2: Clinic Management

### Clinic List

- Searchable by name, ID, status
- Filterable by: Active / Trial / Suspended / Expired
- Sortable by: Name, Created Date, Last Activity, Storage Usage
- Columns: Name | Status Badge | Plan | Users | Storage | Last Active | Actions

### Clinic Profile Page (`/clinics/[clinicId]/profile`)

Tabs:

1. **Overview** — Name, ID, creation date, plan, status, contact info
2. **Users** — Table of clinic's users (name, role, last login, status). No clinical data.
3. **Storage** — Used / quota bar chart. File type breakdown if available.
4. **Activity** — Last 30 days login/activity timeline
5. **Subscription** — Current plan, renewal date, payment status

### Clinic Actions

All actions require confirmation dialogs with typed input for destructive operations:

| Action       | Confirmation Required             | Audit Logged |
| ------------ | --------------------------------- | ------------ |
| Activate     | Yes (simple)                      | Yes          |
| Suspend      | Yes — type clinic name            | Yes          |
| Delete       | Yes — type "DELETE [clinic name]" | Yes          |
| Extend Trial | Yes — pick date                   | Yes          |

```typescript
// Typed confirmation pattern
const ConfirmDestructiveAction = ({ action, clinicName, onConfirm }) => {
  const [input, setInput] = useState('');
  const required = `DELETE ${clinicName}`;
  return (
    <Dialog>
      <p>Type <strong>{required}</strong> to confirm</p>
      <Input value={input} onChange={e => setInput(e.target.value)} />
      <Button disabled={input !== required} onClick={onConfirm} variant="destructive">
        Confirm {action}
      </Button>
    </Dialog>
  );
};
```

---

## Section 3: Subscription & Billing

### Plans Tab

- List all available plans with features, pricing, limits
- Per-clinic: current plan badge, upgrade/downgrade button
- Plan change must show diff of features gained/lost before confirming

### Billing Tab

- Per-clinic billing record: renewal date, amount, payment method, status
- Payment override capability (mark as paid, extend grace period)
- Grace period: configurable (default 7 days after payment failure)
- Invoice history: downloadable PDF per invoice

### Proration Logic (display only — confirm with backend)

When downgrading mid-cycle:

- Show prorated credit calculation
- Show effective date
- Require admin to confirm

### Trials Tab

- List all clinics in trial
- Days remaining counter
- Extend trial: date picker, reason field (required), audit logged
- Convert trial to paid: plan selector + confirmation

---

## Section 4: User Governance

### Users Tab

Scope: Platform/admin users only — NOT clinical users

| Column     | Actions                              |
| ---------- | ------------------------------------ |
| Name       | —                                    |
| Email      | —                                    |
| Clinic     | Link to clinic profile               |
| Role       | —                                    |
| Status     | Active / Locked                      |
| Last Login | —                                    |
| Actions    | Reset Password, Unlock, Force Logout |

**Reset Password:** sends email, does not expose token in UI
**Unlock Account:** re-enables locked account, audit logged
**Force Logout:** invalidates all active sessions for user, audit logged

### Access Logs Tab

- Login history per user or clinic
- Failed login attempts (flag accounts with >5 failures in 1 hour)
- Exportable as CSV
- Date range filter
- Filter by: User, Clinic, Event Type (LOGIN / LOGOUT / FAILED / FORCE_LOGOUT)

---

## Section 5: Feature Control

### Modules Tab

Toggle matrix: Clinics (rows) × Feature Modules (columns)

Modules:

- Diagnostics
- Pharmacy
- Procedures
- Chronic Care
- Automation
- Multi-location

Rules:

- Toggle changes are immediate with optimistic UI + rollback on error
- Some modules may have dependencies (e.g., Multi-location requires base plan+)
- Show warning if toggling a module that has active users/data in it

### Plan Mapping Tab

- Define which modules are included in each plan
- Changes to plan mapping affect all future assignments (not retroactive)
- Show "affected clinics" count before saving

---

## Section 6: Deployment Control

### Templates Tab

Define clinic setup templates:

- Name, description
- Default feature modules
- Default roles/permissions
- Default storage quota

### Module Assignment Tab

- Apply a template to a clinic
- Preview what will change
- Confirm before applying

---

## Section 7: Analytics

### Usage Tab

- Active users per clinic (DAU/WAU/MAU)
- Clinic-level activity heatmap (last 30 days)
- Charts: line chart for user activity trends

### Adoption Tab

- Feature usage rates per module per clinic
- Identify underutilized modules
- Exportable report

All charts must handle empty states gracefully (show "No data yet" — never broken charts).

---

## Section 8: Audit & Compliance

### Activity Logs Tab

All super admin actions are logged automatically:

```typescript
interface AuditLog {
  id: string;
  timestamp: Date;
  adminId: string;
  adminName: string;
  action: string; // e.g., "CLINIC_SUSPENDED"
  targetType: string; // "CLINIC" | "USER" | "SUBSCRIPTION" etc.
  targetId: string;
  clinicId?: string;
  details: Record<string, unknown>; // before/after state
  ipAddress: string;
  sessionId: string;
}
```

- Searchable, filterable by date range, action type, admin, clinic
- Immutable — no delete or edit on audit records
- Export as CSV

### Access Overrides Tab

- Log of all admin interventions (manual payment overrides, trial extensions, force logouts)
- Requires justification field on each override
- Separate from general activity logs for compliance visibility

---

## Section 9: Support Intervention

### Enter Clinic (Support Mode)

**Rules (enforce at UI + API):**

- Session is time-limited: auto-expires after 60 minutes
- Session is read-only: all write operations return 403
- Session is logged: start time, end time, admin ID, clinic ID, pages visited
- Clinical data is BLOCKED: prescriptions, consultations, patient records return empty/403
- A visible "SUPPORT MODE — READ ONLY" banner must appear at all times during session

```typescript
// Support mode context
const SupportModeBanner = () => (
  <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-black text-center py-2 font-bold">
    ⚠ SUPPORT MODE — READ ONLY — Clinical data access is blocked — Session expires in: <SupportModeTimer />
  </div>
);
```

- Exiting support mode returns to super admin panel
- Audit log entry created on entry AND exit

---

## Section 10: Data Management

### Backup Tab

- Trigger manual backup per clinic
- Shows: last backup time, backup size, status
- Backup types: Full / Config-only
- Requires reason field

### Restore Tab

⚠️ HIGH RISK — Multiple gates required:

1. Select clinic to restore
2. Select restore point (list of available backups with date/size)
3. Show what will be overwritten (current data summary)
4. Require secondary admin approval (separate admin must approve in their own session)
5. Typed confirmation: type clinic name
6. Schedule restore (immediate or scheduled time)
7. Audit log with full details

```typescript
interface RestoreRequest {
  clinicId: string;
  backupId: string;
  requestedBy: string;
  approvedBy?: string; // must be different admin
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  scheduledFor?: Date;
  reason: string;
  auditId: string;
}
```

---

## Section 11: Role Management

### Predefined Internal Roles

| Role              | Access Level                                      |
| ----------------- | ------------------------------------------------- |
| Super Admin       | Full access to all sections                       |
| Billing Admin     | Subscriptions, Billing, Clinics (read-only)       |
| Support Agent     | Clinic profile (read), Support Mode, Users (read) |
| Read-Only Auditor | Audit logs, Analytics (read-only)                 |

### Roles Tab

- Create custom internal roles
- Clone from existing role
- Assign roles to internal admin users

### Permissions Tab

- Granular permission matrix: Section × Action (View / Edit / Delete / Override)
- Cannot create a role with more permissions than current admin's own role

---

## Section 12: Feature Rollout

### Beta Release Tab

- Enable experimental features for selected clinics
- Feature flags with: name, description, enabled clinics list
- Rollout percentage slider (% of active clinics)
- Scheduled activation date
- Rollback button per feature flag

---

## Section 13: Security

### 2FA Enforcement Tab

- Per-clinic: require 2FA for all clinic users
- Platform-wide: require 2FA for all super admin users
- Report: clinics with 2FA disabled

### IP Restrictions Tab

- Per-clinic IP allowlist
- Super admin panel IP allowlist
- CIDR range support
- Test IP against allowlist tool

---

## Section 14: Emergency Control

⚠️ All emergency actions require:

1. Reason field (min 20 characters)
2. Typed confirmation
3. Secondary admin notification (email alert sent to all Super Admins)
4. Immediate audit log entry
5. Scheduled auto-reactivation option

### Suspend Clinic

- Immediately blocks all clinic user access
- Clinic data preserved
- Status set to SUSPENDED
- Reactivation path: explicit "Reactivate" action with audit log

### Lock Access

- Temporarily blocks specific user(s) or all users of a clinic
- Specify duration or leave indefinite
- Unlock path is documented on the lock record

---

## Section 15: Notifications

### Alerts Configuration

- Delivery channels per alert type: In-app / Email / SMS
- Recipients: configurable list of admin emails/phones per alert type
- Escalation: if alert unacknowledged after X hours → escalate to secondary recipient

### Alert Types & Default Thresholds

| Alert              | Default Trigger        | Configurable |
| ------------------ | ---------------------- | ------------ |
| Trial Ending       | 7 days before expiry   | Yes          |
| Payment Failure    | On first failure       | No           |
| Storage Near Limit | 85% of quota           | Yes          |
| Clinic Inactive    | 30 days no activity    | Yes          |
| Security Anomaly   | 5 failed logins / hour | Yes          |
| Backup Failed      | On failure             | No           |

---

## Global UI/UX Rules

### Error & Empty States

```typescript
// All data displays must handle these states:
// 1. Loading → Skeleton loader
// 2. Empty → Friendly empty state with icon + message
// 3. Error → Error card with retry button
// 4. Null values → display as 0 or "—" (never undefined/NaN)
```

### Confirmation Dialogs

- Simple actions (activate, extend trial): single confirm button
- Moderate actions (suspend, override): reason field + confirm
- Destructive actions (delete, restore): type-to-confirm + reason + audit

### Notifications

- All successful actions → toast: green, auto-dismiss 4s
- All failures → toast: red, manual dismiss, with error detail
- All audit-logged actions → show "Action logged" in toast

### Navigation

- Active route highlighted in sidebar
- Breadcrumbs on all sub-pages
- Back button where applicable

### Forbidden Patterns (never use these)

- ❌ Marketplace language ("store", "marketplace", "listing", "public")
- ❌ Patient-facing language ("patient", "appointment booking", "health record" in UI labels)
- ❌ Clinical operation buttons
- ❌ Exposing raw IDs to UI (use formatted references)
- ❌ `NaN`, `undefined`, `null` rendered to screen

---

## API Contract Notes

All endpoints must:

- Require `Authorization: Bearer <superAdminToken>` header
- Return `403` for any clinical data request
- Include `X-Tenant-Id` in all responses for auditability
- Log to audit trail server-side (not just client-side)

Suggested endpoint pattern:

```
GET    /api/super-admin/clinics
GET    /api/super-admin/clinics/:id
PATCH  /api/super-admin/clinics/:id/status
POST   /api/super-admin/clinics/:id/backup
POST   /api/super-admin/restore-requests
GET    /api/super-admin/audit-logs
POST   /api/super-admin/support-sessions
DELETE /api/super-admin/support-sessions/:id
```

---

## Implementation Order (Recommended)

1. Auth guard + role middleware
2. Overview dashboard (read-only, high visibility)
3. Clinic list + profile
4. Subscription & billing
5. User governance + access logs
6. Feature control (modules)
7. Audit & compliance
8. Support mode (with all read-only enforcement)
9. Data management (backup first, restore with full gates)
10. Security + emergency controls
11. Notifications
12. Analytics
13. Deployment + rollout features
14. Role management

---

## Testing Checklist

- [ ] All values default to `0` when data is absent
- [ ] Clinical data endpoints return 403
- [ ] Support mode banner always visible
- [ ] Support mode auto-expires after 60 minutes
- [ ] Restore requires two distinct admin approvals
- [ ] All destructive actions have typed confirmation
- [ ] All actions are written to audit log
- [ ] Role permissions block UI and API correctly
- [ ] Session timeout at 30 minutes inactivity
- [ ] Emergency actions notify all super admins via email
