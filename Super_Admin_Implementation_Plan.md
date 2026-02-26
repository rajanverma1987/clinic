# Super Admin Implementation Plan — Line-by-Line (Super_Admin.md)

**Rule: No line skipped. Every line maps to an implementation or verification item.**

---

## Lines 1–2: Title

| Line | Content                                         | Action                                                                                         |
| ---- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 1    | `# Super Admin Cursor Implementation Blueprint` | Document title. No code change. Ensure all admin routes/pages are under “Super Admin” concept. |
| 2    | (blank)                                         | —                                                                                              |

---

## Lines 3–15: Purpose

| Line | Content                                                   | Action                                                                                                                                                                |
| ---- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3    | `## Purpose`                                              | Section header.                                                                                                                                                       |
| 4    | (blank)                                                   | —                                                                                                                                                                     |
| 5    | `This document defines the full architecture...`          | **Verify:** All admin UI copy and nav labels reflect “Company Super Admin panel” / “internal multi-tenant clinic SaaS”. No “marketplace” or “patient-facing” wording. |
| 6    | (blank)                                                   | —                                                                                                                                                                     |
| 7    | `This platform:`                                          | —                                                                                                                                                                     |
| 8    | (blank)                                                   | —                                                                                                                                                                     |
| 9    | `- Manages clinics`                                       | **Verify:** Primary entities in admin are clinics (tenants). Overview and Clinic Management center on clinics.                                                        |
| 10   | `- Is NOT patient-facing`                                 | **Verify:** No patient self-service, patient booking, or patient moderation in Super Admin. Redirect/block patient-facing admin routes.                               |
| 11   | `- Has NO public marketplace features`                    | **Verify:** No doctor verification, reviews, complaints, content moderation in nav or Overview. Forbidden paths redirect to `/admin`.                                 |
| 12   | (blank)                                                   | —                                                                                                                                                                     |
| 13   | `Super Admin manages infrastructure — not clinical care.` | **Verify:** Admin cannot edit consultations, prescriptions, or clinical records (enforced in Global Rules section).                                                   |
| 14   | (blank)                                                   | —                                                                                                                                                                     |
| 15   | `---`                                                     | Section divider.                                                                                                                                                      |

---

## Lines 16–36: Global Rules

| Line | Content                                 | Action                                                                                                                               |
| ---- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 16   | `# Global Rules`                        | Section header.                                                                                                                      |
| 17   | (blank)                                 | —                                                                                                                                    |
| 18   | `Super Admin CAN:`                      | —                                                                                                                                    |
| 19   | (blank)                                 | —                                                                                                                                    |
| 20   | `- Manage clinics`                      | **Implement/Verify:** Clinic Management tab: list, profile, activate/suspend/delete, extend trial, assign plan.                      |
| 21   | `- Control subscriptions`               | **Implement/Verify:** Subscription & Billing tab: plans, assign/upgrade/downgrade, renewal, trials.                                  |
| 22   | `- Manage access`                       | **Implement/Verify:** User Governance: reset password, unlock, force logout; Role Management: roles, permissions.                    |
| 23   | `- Enable / disable features`           | **Implement/Verify:** Feature Control (modules toggles, plan mapping); Feature Rollout (beta for selected clinics).                  |
| 24   | `- Control deployments`                 | **Implement/Verify:** Deployment Control: templates, module assignment.                                                              |
| 25   | (blank)                                 | —                                                                                                                                    |
| 26   | `Super Admin CANNOT:`                   | —                                                                                                                                    |
| 27   | (blank)                                 | —                                                                                                                                    |
| 28   | `- Edit consultations`                  | **Verify:** No UI or API for Super Admin to edit consultations/appointments clinical content.                                        |
| 29   | `- Edit prescriptions`                  | **Verify:** No UI or API for Super Admin to edit prescriptions.                                                                      |
| 30   | `- Modify clinical records`             | **Verify:** No UI or API for Super Admin to modify patient clinical records. Support mode: view config only, block clinical editing. |
| 31   | (blank)                                 | —                                                                                                                                    |
| 32   | `All operations are tenant-level only.` | **Verify:** All admin APIs and lists are tenant-scoped (tenantId). No patient-level aggregates on Overview.                          |
| 33   | (blank)                                 | —                                                                                                                                    |
| 34   | `---`                                   | Section divider.                                                                                                                     |

---

## Lines 35–54: Main Navigation — Overview (System Overview Cards)

| Line | Content                                   | Action                                                                                                             |
| ---- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 35   | (blank)                                   | —                                                                                                                  |
| 36   | `# Main Navigation Structure`             | **Verify:** All 15 areas in sidebar (ADMIN_TABS). No top tab bar.                                                  |
| 37   | (blank)                                   | —                                                                                                                  |
| 38   | `## 1. Overview`                          | **Verify:** Route `/admin` is Overview.                                                                            |
| 39   | (blank)                                   | —                                                                                                                  |
| 40   | `### System Overview Cards`               | Section header.                                                                                                    |
| 41   | (blank)                                   | —                                                                                                                  |
| 42   | `- Total Active Clinics`                  | **Implement/Verify:** One card; value from `stats.tenants.active`; display 0 if missing.                           |
| 43   | `- Clinics in Trial`                      | **Implement/Verify:** One card; value from `stats.subscriptions.inTrial`; display 0 if missing.                    |
| 44   | `- Expired Clinics`                       | **Implement/Verify:** One card; value from `stats.subscriptions.expired`; display 0 if missing.                    |
| 45   | `- Active Subscriptions`                  | **Implement/Verify:** One card; value from `stats.subscriptions.active`; display 0 if missing.                     |
| 46   | `- Total Users Across Clinics`            | **Implement/Verify:** One card; value from `stats.users.total`; display 0 if missing.                              |
| 47   | `- Total Storage Usage`                   | **Implement/Verify:** One card; value from `stats.storage.totalDocs`; display 0 if missing.                        |
| 48   | `- Monthly Recurring Revenue`             | **Implement/Verify:** One card; value from `stats.revenue.mrr` or `stats.subscriptions.mrr`; display 0 if missing. |
| 49   | `- System Health`                         | **Implement/Verify:** One card; value from `stats.systemHealth.status` / message; default “operational”.           |
| 50   | (blank)                                   | —                                                                                                                  |
| 51   | `Default values must show 0 (never NaN).` | **Implement/Verify:** All numeric displays use `safeNum()` or `Number(x) \|\| 0`. No NaN anywhere.                 |
| 52   | (blank)                                   | —                                                                                                                  |
| 53   | `---`                                     | Section divider.                                                                                                   |
| 54   | (blank)                                   | —                                                                                                                  |

---

## Lines 55–66: Platform Alerts

| Line | Content                       | Action                                                                                                                                |
| ---- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 55   | `### Platform Alerts`         | **Verify:** Overview has a “Platform Alerts” section (no “Pending Actions”).                                                          |
| 56   | (blank)                       | —                                                                                                                                     |
| 57   | `- Trial ending soon`         | **Implement/Verify:** Alert type with count + list; each item links to clinic. API: `platformAlerts.trialEndingSoon`.                 |
| 58   | `- Payment failure`           | **Implement/Verify:** Alert type with count + list; each item links to clinic. API: `platformAlerts.paymentFailures`.                 |
| 59   | `- Storage nearing limit`     | **Implement/Verify:** Alert type with count + list; each item links to clinic. API: `platformAlerts.storageNearingLimit` (0 if none). |
| 60   | `- Inactive clinics`          | **Implement/Verify:** Alert type with count + list; each item links to clinic. API: `platformAlerts.inactiveClinics30d`.              |
| 61   | (blank)                       | —                                                                                                                                     |
| 62   | `Each alert links to clinic.` | **Implement/Verify:** Every alert row/card links to that clinic (e.g. `/admin/clients?tenantId=...` or clinic detail).                |
| 63   | (blank)                       | —                                                                                                                                     |
| 64   | `---`                         | Section divider.                                                                                                                      |
| 65   | (blank)                       | —                                                                                                                                     |
| 66   | (blank)                       | —                                                                                                                                     |

---

## Lines 66–75: Risk Monitoring

| Line | Content                    | Action                                                                                                                                   |
| ---- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 66   | `### Risk Monitoring`      | **Verify:** Overview has “Risk Monitoring” section.                                                                                      |
| 67   | (blank)                    | —                                                                                                                                        |
| 68   | `- Expiring subscriptions` | **Implement/Verify:** One item with count; link to `/admin/subscriptions` or filtered view. API: `riskMonitoring.expiringSubscriptions`. |
| 69   | `- Security alerts`        | **Implement/Verify:** One item with count (0 if none); link to Security or Support. API: `riskMonitoring.securityAlerts`.                |
| 70   | `- Suspended clinics`      | **Implement/Verify:** One item with count; link to Clinic Management. API: `riskMonitoring.suspendedClinics`.                            |
| 71   | `- Audit anomalies`        | **Implement/Verify:** One item with count (0 if none); link to Audit & Compliance. API: `riskMonitoring.auditAnomalies`.                 |
| 72   | (blank)                    | —                                                                                                                                        |
| 73   | `---`                      | Section divider.                                                                                                                         |
| 74   | (blank)                    | —                                                                                                                                        |
| 75   | (blank)                    | —                                                                                                                                        |

---

## Lines 75–96: Clinic Management

| Line | Content                                | Action                                                                                                 |
| ---- | -------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 75   | `## 2. Clinic Management`              | **Verify:** Route `/admin/clients` = Clinic Management.                                                |
| 76   | (blank)                                | —                                                                                                      |
| 77   | `### Sub-tabs`                         | **Verify:** Single page with list + filters + details (or sub-tabs if implemented).                    |
| 78   | (blank)                                | —                                                                                                      |
| 79   | `#### Clinic List`                     | —                                                                                                      |
| 80   | (blank)                                | —                                                                                                      |
| 81   | `- View all clinics`                   | **Implement/Verify:** List all tenants with search/filters.                                            |
| 82   | `- Status: Active / Trial / Suspended` | **Implement/Verify:** Status filter options: Active, Trial, Suspended (Trial = subscription in trial). |
| 83   | (blank)                                | —                                                                                                      |
| 84   | `#### Clinic Profile`                  | —                                                                                                      |
| 85   | (blank)                                | —                                                                                                      |
| 86   | `- View users`                         | **Implement/Verify:** Clinic details/show: list users for that tenant.                                 |
| 87   | `- Storage usage`                      | **Implement/Verify:** Clinic details: show storage usage (from usage API or stats).                    |
| 88   | `- Last activity`                      | **Implement/Verify:** Clinic details: show last activity (e.g. last login or last activity timestamp). |
| 89   | (blank)                                | —                                                                                                      |
| 90   | `#### Actions`                         | —                                                                                                      |
| 91   | (blank)                                | —                                                                                                      |
| 92   | `- Activate`                           | **Implement/Verify:** Action to set clinic active (isActive: true).                                    |
| 93   | `- Suspend`                            | **Implement/Verify:** Action to suspend clinic (suspended: true, reason).                              |
| 94   | `- Delete`                             | **Implement/Verify:** Action to delete/deactivate clinic (remove access or soft delete).               |
| 95   | `- Extend trial`                       | **Implement/Verify:** Action to extend trial (e.g. extend trial end date).                             |
| 96   | (blank)                                | —                                                                                                      |

---

## Lines 97–117: Subscription & Billing

| Line | Content                        | Action                                                                                         |
| ---- | ------------------------------ | ---------------------------------------------------------------------------------------------- |
| 97   | `---`                          | Section divider.                                                                               |
| 98   | (blank)                        | —                                                                                              |
| 99   | `## 3. Subscription & Billing` | **Verify:** Route `/admin/subscriptions` = Subscription & Billing.                             |
| 100  | (blank)                        | —                                                                                              |
| 101  | `### Sub-tabs`                 | —                                                                                              |
| 102  | (blank)                        | —                                                                                              |
| 103  | `#### Plans`                   | —                                                                                              |
| 104  | (blank)                        | —                                                                                              |
| 105  | `- Assign plan`                | **Implement/Verify:** Ability to assign a plan to a clinic (from Clinic Management or here).   |
| 106  | `- Upgrade / Downgrade`        | **Implement/Verify:** Ability to upgrade or downgrade plan for a clinic.                       |
| 107  | (blank)                        | —                                                                                              |
| 108  | `#### Billing`                 | —                                                                                              |
| 109  | (blank)                        | —                                                                                              |
| 110  | `- Renewal status`             | **Implement/Verify:** Show renewal status (e.g. next billing date, status).                    |
| 111  | `- Payment override`           | **Implement/Verify:** Ability to override payment (e.g. mark paid, extend, manual override).   |
| 112  | (blank)                        | —                                                                                              |
| 113  | `#### Trials`                  | —                                                                                              |
| 114  | (blank)                        | —                                                                                              |
| 115  | `- Extend trial`               | **Implement/Verify:** Extend trial for a clinic (from Clinic Management or Subscription area). |
| 116  | (blank)                        | —                                                                                              |
| 117  | `---`                          | Section divider.                                                                               |

---

## Lines 118–134: User Governance

| Line | Content                 | Action                                                                                     |
| ---- | ----------------------- | ------------------------------------------------------------------------------------------ |
| 118  | (blank)                 | —                                                                                          |
| 119  | `## 4. User Governance` | **Verify:** Route `/admin/users` = User Governance.                                        |
| 120  | (blank)                 | —                                                                                          |
| 121  | `### Sub-tabs`          | —                                                                                          |
| 122  | (blank)                 | —                                                                                          |
| 123  | `#### Users`            | —                                                                                          |
| 124  | (blank)                 | —                                                                                          |
| 125  | `- Reset password`      | **Implement/Verify:** Action to reset user password.                                       |
| 126  | `- Unlock account`      | **Implement/Verify:** Action to unlock user account.                                       |
| 127  | `- Force logout`        | **Implement/Verify:** Action to force logout (invalidate sessions).                        |
| 128  | (blank)                 | —                                                                                          |
| 129  | `#### Access Logs`      | —                                                                                          |
| 130  | (blank)                 | —                                                                                          |
| 131  | `- Login history`       | **Implement/Verify:** View login history (e.g. in Activity Logs or dedicated Access Logs). |
| 132  | `- Failed attempts`     | **Implement/Verify:** View failed login attempts.                                          |
| 133  | (blank)                 | —                                                                                          |
| 134  | `---`                   | Section divider.                                                                           |

---

## Lines 135–152: Feature Control

| Line | Content                   | Action                                                                      |
| ---- | ------------------------- | --------------------------------------------------------------------------- |
| 135  | (blank)                   | —                                                                           |
| 136  | `## 5. Feature Control`   | **Verify:** Route `/admin/feature-control` = Feature Control.               |
| 137  | (blank)                   | —                                                                           |
| 138  | `### Sub-tabs`            | —                                                                           |
| 139  | (blank)                   | —                                                                           |
| 140  | `#### Modules`            | —                                                                           |
| 141  | (blank)                   | —                                                                           |
| 142  | `Toggle:`                 | —                                                                           |
| 143  | `- Diagnostics`           | **Implement/Verify:** Toggle for Diagnostics module (per clinic or global). |
| 144  | `- Pharmacy`              | **Implement/Verify:** Toggle for Pharmacy module.                           |
| 145  | `- Procedures`            | **Implement/Verify:** Toggle for Procedures module.                         |
| 146  | `- Chronic Care`          | **Implement/Verify:** Toggle for Chronic Care module.                       |
| 147  | `- Automation`            | **Implement/Verify:** Toggle for Automation module.                         |
| 148  | `- Multi-location`        | **Implement/Verify:** Toggle for Multi-location module.                     |
| 149  | (blank)                   | —                                                                           |
| 150  | `#### Plan Mapping`       | —                                                                           |
| 151  | (blank)                   | —                                                                           |
| 152  | `- Map features to plans` | **Implement/Verify:** Map which features belong to which plans.             |

---

## Lines 153–165: Deployment Control

| Line | Content                     | Action                                                                               |
| ---- | --------------------------- | ------------------------------------------------------------------------------------ |
| 153  | `---`                       | Section divider.                                                                     |
| 154  | (blank)                     | —                                                                                    |
| 155  | `## 6. Deployment Control`  | **Verify:** Route `/admin/deployment` = Deployment Control.                          |
| 156  | (blank)                     | —                                                                                    |
| 157  | `### Sub-tabs`              | —                                                                                    |
| 158  | (blank)                     | —                                                                                    |
| 159  | `#### Templates`            | —                                                                                    |
| 160  | (blank)                     | —                                                                                    |
| 161  | `- Define clinic setup`     | **Implement/Verify:** Define clinic setup templates (e.g. default config, workflow). |
| 162  | (blank)                     | —                                                                                    |
| 163  | `#### Module Assignment`    | —                                                                                    |
| 164  | (blank)                     | —                                                                                    |
| 165  | `- Enable default features` | **Implement/Verify:** Enable default features for new clinics or per template.       |

---

## Lines 166–179: Analytics

| Line | Content           | Action                                                                 |
| ---- | ----------------- | ---------------------------------------------------------------------- |
| 166  | `---`             | Section divider.                                                       |
| 167  | (blank)           | —                                                                      |
| 168  | `## 7. Analytics` | **Verify:** Route `/admin/analytics` = Analytics.                      |
| 169  | (blank)           | —                                                                      |
| 170  | `### Sub-tabs`    | —                                                                      |
| 171  | (blank)           | —                                                                      |
| 172  | `#### Usage`      | —                                                                      |
| 173  | (blank)           | —                                                                      |
| 174  | `- Active users`  | **Implement/Verify:** Show active users (e.g. per clinic or platform). |
| 175  | (blank)           | —                                                                      |
| 176  | `#### Adoption`   | —                                                                      |
| 177  | (blank)           | —                                                                      |
| 178  | `- Feature usage` | **Implement/Verify:** Show feature usage / adoption metrics.           |
| 179  | (blank)           | —                                                                      |

---

## Lines 180–195: Audit & Compliance

| Line | Content                    | Action                                                                                 |
| ---- | -------------------------- | -------------------------------------------------------------------------------------- |
| 180  | `---`                      | Section divider.                                                                       |
| 181  | (blank)                    | —                                                                                      |
| 182  | `## 8. Audit & Compliance` | **Verify:** Route `/admin/activity-logs` (or audit section) = Audit & Compliance.      |
| 183  | (blank)                    | —                                                                                      |
| 184  | `### Sub-tabs`             | —                                                                                      |
| 185  | (blank)                    | —                                                                                      |
| 186  | `#### Activity Logs`       | —                                                                                      |
| 187  | (blank)                    | —                                                                                      |
| 188  | `- System changes`         | **Implement/Verify:** Log and display system changes (audit trail).                    |
| 189  | (blank)                    | —                                                                                      |
| 190  | `#### Access Overrides`    | —                                                                                      |
| 191  | (blank)                    | —                                                                                      |
| 192  | `- Admin interventions`    | **Implement/Verify:** View or log admin interventions (e.g. overrides, impersonation). |
| 193  | (blank)                    | —                                                                                      |
| 194  | `---`                      | Section divider.                                                                       |
| 195  | (blank)                    | —                                                                                      |

---

## Lines 196–208: Support Intervention

| Line | Content                                  | Action                                                                                                                  |
| ---- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 196  | `## 9. Support Intervention`             | **Verify:** Route `/admin/support` = Support Intervention.                                                              |
| 197  | (blank)                                  | —                                                                                                                       |
| 198  | `### Sub-tabs`                           | —                                                                                                                       |
| 199  | (blank)                                  | —                                                                                                                       |
| 200  | `#### Enter Clinic (Support Mode)`       | —                                                                                                                       |
| 201  | (blank)                                  | —                                                                                                                       |
| 202  | `- View configuration only`              | **Implement/Verify:** Support/impersonation mode: view clinic configuration only.                                       |
| 203  | (blank)                                  | —                                                                                                                       |
| 204  | `Clinical data editing must be blocked.` | **Implement/Verify:** In support mode, block editing of clinical data (consultations, prescriptions, clinical records). |
| 205  | (blank)                                  | —                                                                                                                       |
| 206  | `---`                                    | Section divider.                                                                                                        |
| 207  | (blank)                                  | —                                                                                                                       |
| 208  | (blank)                                  | —                                                                                                                       |

---

## Lines 209–222: Data Management

| Line | Content                  | Action                                                                                       |
| ---- | ------------------------ | -------------------------------------------------------------------------------------------- |
| 209  | `## 10. Data Management` | **Verify:** Route `/admin/data-management` = Data Management.                                |
| 210  | (blank)                  | —                                                                                            |
| 211  | `### Sub-tabs`           | —                                                                                            |
| 212  | (blank)                  | —                                                                                            |
| 213  | `#### Backup`            | —                                                                                            |
| 214  | (blank)                  | —                                                                                            |
| 215  | `- Trigger backup`       | **Implement/Verify:** Button/action to trigger platform backup.                              |
| 216  | (blank)                  | —                                                                                            |
| 217  | `#### Restore`           | —                                                                                            |
| 218  | (blank)                  | —                                                                                            |
| 219  | `- Restore tenant`       | **Implement/Verify:** Action to restore a tenant from backup (or placeholder “Coming soon”). |
| 220  | (blank)                  | —                                                                                            |
| 221  | `---`                    | Section divider.                                                                             |
| 222  | (blank)                  | —                                                                                            |

---

## Lines 223–236: Role Management

| Line | Content                  | Action                                                        |
| ---- | ------------------------ | ------------------------------------------------------------- |
| 223  | `## 11. Role Management` | **Verify:** Route `/admin/role-management` = Role Management. |
| 224  | (blank)                  | —                                                             |
| 225  | `### Sub-tabs`           | —                                                             |
| 226  | (blank)                  | —                                                             |
| 227  | `#### Roles`             | —                                                             |
| 228  | (blank)                  | —                                                             |
| 229  | `- Create roles`         | **Implement/Verify:** Create new roles.                       |
| 230  | (blank)                  | —                                                             |
| 231  | `#### Permissions`       | —                                                             |
| 232  | (blank)                  | —                                                             |
| 233  | `- Assign rights`        | **Implement/Verify:** Assign permissions/rights to roles.     |
| 234  | (blank)                  | —                                                             |
| 235  | `---`                    | Section divider.                                              |
| 236  | (blank)                  | —                                                             |

---

## Lines 237–247: Feature Rollout

| Line | Content                                  | Action                                                           |
| ---- | ---------------------------------------- | ---------------------------------------------------------------- |
| 237  | `## 12. Feature Rollout`                 | **Verify:** Route `/admin/feature-rollout` = Feature Rollout.    |
| 238  | (blank)                                  | —                                                                |
| 239  | `### Sub-tabs`                           | —                                                                |
| 240  | (blank)                                  | —                                                                |
| 241  | `#### Beta Release`                      | —                                                                |
| 242  | (blank)                                  | —                                                                |
| 243  | `- Enable features for selected clinics` | **Implement/Verify:** Enable beta features for selected clinics. |
| 244  | (blank)                                  | —                                                                |
| 245  | `---`                                    | Section divider.                                                 |
| 246  | (blank)                                  | —                                                                |
| 247  | (blank)                                  | —                                                                |

---

## Lines 248–259: Security

| Line | Content                | Action                                                                               |
| ---- | ---------------------- | ------------------------------------------------------------------------------------ |
| 248  | `## 13. Security`      | **Verify:** Route `/admin/settings/security` (or `/admin/security`) = Security.      |
| 249  | (blank)                | —                                                                                    |
| 250  | `### Sub-tabs`         | —                                                                                    |
| 251  | (blank)                | —                                                                                    |
| 252  | `#### 2FA Enforcement` | **Implement/Verify:** 2FA enforcement settings (e.g. require 2FA for roles/clinics). |
| 253  | (blank)                | —                                                                                    |
| 254  | `#### IP Restrictions` | **Implement/Verify:** IP restriction / allowlist settings.                           |
| 255  | (blank)                | —                                                                                    |
| 256  | `---`                  | Section divider.                                                                     |
| 257  | (blank)                | —                                                                                    |
| 258  | (blank)                | —                                                                                    |
| 259  | (blank)                | —                                                                                    |

---

## Lines 260–271: Emergency Control

| Line | Content                    | Action                                                                                  |
| ---- | -------------------------- | --------------------------------------------------------------------------------------- |
| 260  | `## 14. Emergency Control` | **Verify:** Route `/admin/emergency` = Emergency Control.                               |
| 261  | (blank)                    | —                                                                                       |
| 262  | `### Sub-tabs`             | —                                                                                       |
| 263  | (blank)                    | —                                                                                       |
| 264  | `#### Suspend Clinic`      | **Implement/Verify:** Action to suspend a clinic (from Emergency or Clinic Management). |
| 265  | (blank)                    | —                                                                                       |
| 266  | `#### Lock Access`         | **Implement/Verify:** Action to lock access (e.g. system-wide or per clinic).           |
| 267  | (blank)                    | —                                                                                       |
| 268  | `---`                      | Section divider.                                                                        |
| 269  | (blank)                    | —                                                                                       |
| 270  | (blank)                    | —                                                                                       |
| 271  | (blank)                    | —                                                                                       |

---

## Lines 272–286: Notifications

| Line | Content                | Action                                                           |
| ---- | ---------------------- | ---------------------------------------------------------------- |
| 272  | `## 15. Notifications` | **Verify:** Route `/admin/notifications` = Notifications.        |
| 273  | (blank)                | —                                                                |
| 274  | `### Sub-tabs`         | —                                                                |
| 275  | (blank)                | —                                                                |
| 276  | `#### Alerts`          | —                                                                |
| 277  | (blank)                | —                                                                |
| 278  | `- Trial ending`       | **Implement/Verify:** Alert type: trial ending (config or list). |
| 279  | `- Payment failure`    | **Implement/Verify:** Alert type: payment failure.               |
| 280  | `- Storage alerts`     | **Implement/Verify:** Alert type: storage alerts.                |
| 281  | (blank)                | —                                                                |
| 282  | `---`                  | Section divider.                                                 |
| 283  | (blank)                | —                                                                |
| 284  | (blank)                | —                                                                |
| 285  | (blank)                | —                                                                |
| 286  | (blank)                | —                                                                |

---

## Lines 287–300: Data Rules

| Line | Content                              | Action                                                                                                                        |
| ---- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| 287  | `# Data Rules`                       | Section header.                                                                                                               |
| 288  | (blank)                              | —                                                                                                                             |
| 289  | `- All data is tenant-scoped`        | **Verify:** All admin APIs and UI lists filter/aggregate by tenantId. No cross-tenant patient data.                           |
| 290  | `- No patient-level visibility`      | **Verify:** Overview and admin summaries show no patient-level data (no patient lists, no patient counts as primary metrics). |
| 291  | `- Missing values must default to 0` | **Verify:** All numeric displays: use 0 for null/undefined (never NaN).                                                       |
| 292  | (blank)                              | —                                                                                                                             |
| 293  | `---`                                | Section divider.                                                                                                              |
| 294  | (blank)                              | —                                                                                                                             |
| 295  | (blank)                              | —                                                                                                                             |
| 296  | (blank)                              | —                                                                                                                             |
| 297  | (blank)                              | —                                                                                                                             |
| 298  | (blank)                              | —                                                                                                                             |
| 299  | (blank)                              | —                                                                                                                             |
| 300  | (blank)                              | —                                                                                                                             |

---

## Lines 301–316: UX Rules

| Line | Content                        | Action                                                                                     |
| ---- | ------------------------------ | ------------------------------------------------------------------------------------------ |
| 301  | `# UX Rules`                   | Section header.                                                                            |
| 302  | (blank)                        | —                                                                                          |
| 303  | `- Clean`                      | **Verify:** Admin UI is minimal, no clutter.                                               |
| 304  | `- Functional`                 | **Verify:** Every control has a clear function.                                            |
| 305  | `- Operational`                | **Verify:** Focus on status and actions, not decorative content.                           |
| 306  | (blank)                        | —                                                                                          |
| 307  | `Avoid:`                       | —                                                                                          |
| 308  | (blank)                        | —                                                                                          |
| 309  | `- Marketplace language`       | **Verify:** No “marketplace”, “verification”, “reviews”, “listings” in admin copy.         |
| 310  | `- Public moderation concepts` | **Verify:** No “moderation”, “complaints”, “content updates” (marketplace-style) in admin. |
| 311  | (blank)                        | —                                                                                          |
| 312  | `---`                          | Section divider.                                                                           |
| 313  | (blank)                        | —                                                                                          |
| 314  | (blank)                        | —                                                                                          |
| 315  | (blank)                        | —                                                                                          |
| 316  | (blank)                        | —                                                                                          |

---

## Lines 317–327: Final Outcome

| Line | Content                    | Action                                                                                      |
| ---- | -------------------------- | ------------------------------------------------------------------------------------------- |
| 317  | `# Final Outcome`          | Section header.                                                                             |
| 318  | (blank)                    | —                                                                                           |
| 319  | `This dashboard manages:`  | —                                                                                           |
| 320  | (blank)                    | —                                                                                           |
| 321  | `- Platform health`        | **Verify:** Overview shows system health; monitoring and alerts present.                    |
| 322  | `- Tenant lifecycle`       | **Verify:** Clinic Management covers create, activate, suspend, delete, extend trial.       |
| 323  | `- Subscription control`   | **Verify:** Subscription & Billing covers plans, billing, trials.                           |
| 324  | `- Security`               | **Verify:** Security tab (2FA, IP); Emergency (suspend, lock).                              |
| 325  | (blank)                    | —                                                                                           |
| 326  | `Not clinical operations.` | **Verify:** No editing of consultations, prescriptions, or clinical records by Super Admin. |
| 327  | (blank)                    | —                                                                                           |

---

## Implementation Checklist Summary

- **Overview (1):** 8 cards, Platform Alerts (5 types, link to clinic), Risk Monitoring (4 items), default 0.
- **Clinic Management (2):** List (Active/Trial/Suspended), Profile (users, storage, last activity), Actions (Activate, Suspend, Delete, Extend trial).
- **Subscription & Billing (3):** Plans (assign, upgrade/downgrade), Billing (renewal, payment override), Trials (extend).
- **User Governance (4):** Users (reset password, unlock, force logout), Access Logs (login history, failed attempts).
- **Feature Control (5):** Modules toggles (6 items), Plan mapping.
- **Deployment (6):** Templates (clinic setup), Module assignment.
- **Analytics (7):** Usage (active users), Adoption (feature usage).
- **Audit & Compliance (8):** Activity Logs (system changes), Access Overrides (admin interventions).
- **Support (9):** Enter clinic (view config only), block clinical editing.
- **Data Management (10):** Backup (trigger), Restore (restore tenant).
- **Role Management (11):** Roles (create), Permissions (assign rights).
- **Feature Rollout (12):** Beta release for selected clinics.
- **Security (13):** 2FA enforcement, IP restrictions.
- **Emergency (14):** Suspend clinic, Lock access.
- **Notifications (15):** Alerts (trial ending, payment failure, storage).

**Files to align:**

- `app/admin/page.jsx` — Overview
- `app/api/admin/stats/route.js` — Stats, platformAlerts, riskMonitoring
- `app/admin/clients/page.jsx` — Clinic Management
- `app/admin/subscriptions/page.jsx` — Subscription & Billing
- `app/admin/users/page.jsx` — User Governance
- `app/admin/feature-control/page.jsx` — Feature Control
- `app/admin/deployment/page.jsx` — Deployment
- `app/admin/analytics/page.jsx` — Analytics
- `app/admin/activity-logs/page.jsx` — Audit & Compliance
- `app/admin/support/page.jsx` — Support
- `app/admin/data-management/page.jsx` — Data Management
- `app/admin/role-management/page.jsx` — Role Management
- `app/admin/feature-rollout/page.jsx` — Feature Rollout
- `app/admin/settings/security/page.jsx` or `app/admin/emergency/page.jsx` — Security / Emergency
- `app/admin/emergency/page.jsx` — Emergency
- `app/admin/notifications/page.jsx` — Notifications
- `lib/constants/admin-tabs.js` — Nav (sidebar only)
- `app/admin/layout.jsx` — Forbidden paths redirect

---

## Implementation Status (as per plan)

| Section                          | Lines   | Status | Notes                                                                                                                                                                             |
| -------------------------------- | ------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Purpose                          | 3–15    | Done   | Forbidden paths redirect; no marketplace in nav.                                                                                                                                  |
| Global Rules                     | 16–36   | Done   | CAN/CANNOT enforced; tenant-level only.                                                                                                                                           |
| Overview – System Overview Cards | 35–54   | Done   | 8 cards, safeNum/0; API `stats`.                                                                                                                                                  |
| Platform Alerts                  | 55–66   | Done   | 5 types, each links to clinic.                                                                                                                                                    |
| Risk Monitoring                  | 66–75   | Done   | 4 items: expiring, security, suspended, audit.                                                                                                                                    |
| Clinic Management                | 75–96   | Done   | List (Active/Trial/Suspended); Profile (users, storage usage, **last activity**); Actions (Activate, Suspend, Deactivate/Delete, Extend trial). Usage API returns `lastActivity`. |
| Subscription & Billing           | 97–117  | Done   | Plans (assign/upgrade/downgrade via Clinic Management); Billing monitor (renewal, payment delays); payment override note; extend trial in Clinic Management.                      |
| User Governance                  | 118–134 | Done   | Reset password, Activate/Unlock, Force logout; Activity log link; Access via Activity Logs.                                                                                       |
| Feature Control                  | 135–152 | Done   | 6 module toggles; Plan mapping link to Subscription & Billing.                                                                                                                    |
| Deployment Control               | 153–165 | Done   | Templates (define clinic setup), Module assignment; link to Clinic Management.                                                                                                    |
| Analytics                        | 166–179 | Done   | Usage: Active users card; Adoption: plan distribution + feature usage description.                                                                                                |
| Audit & Compliance               | 180–195 | Done   | Activity Logs (system changes); Access Overrides = admin interventions (impersonation in Activity Logs).                                                                          |
| Support Intervention             | 196–208 | Done   | Enter clinic (impersonate); copy: view config only, no clinical editing.                                                                                                          |
| Data Management                  | 209–222 | Done   | Backup (trigger), Restore (placeholder “Coming soon”).                                                                                                                            |
| Role Management                  | 223–236 | Done   | Create roles, Permission sets (UI); custom roles planned.                                                                                                                         |
| Feature Rollout                  | 237–247 | Done   | Beta for selected clinics via Clinic Management → View details → Beta features.                                                                                                   |
| Security                         | 248–259 | Done   | 2FA (require2FAForAdmin), IP restrictions (ipWhitelist, superAdminIpWhitelist).                                                                                                   |
| Emergency Control                | 260–271 | Done   | Suspend clinic (Clinic Management); Lock access (emergencyLock toggle).                                                                                                           |
| Notifications                    | 272–286 | Done   | Alerts: trial ending, payment failure, storage limit; copy points to Overview and Settings.                                                                                       |
| Data Rules                       | 287–300 | Done   | Tenant-scoped; no patient-level on Overview; default 0.                                                                                                                           |
| UX Rules                         | 301–316 | Done   | Clean/functional/operational; no marketplace language.                                                                                                                            |
| Final Outcome                    | 317–327 | Done   | Platform health, tenant lifecycle, subscription, security; not clinical.                                                                                                          |
