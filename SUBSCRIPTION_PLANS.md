# Subscription Plans

## Overview

Three subscription plans have been created for the clinic management system with different feature sets and limits.

---

## Plan Details

### 1. Basic Plan
**Price:** $49.99/month  
**Description:** Perfect for small clinics getting started

**Features:**
- Patient Management
- Appointment Scheduling
- Queue Management
- Prescriptions Management
- Invoice & Billing
- Inventory Management

**Limits:**
- Max Users: 5
- Max Patients: 500
- Max Storage: 10 GB

---

### 2. Professional Plan (Popular)
**Price:** $99.99/month  
**Description:** Ideal for growing clinics with advanced needs

**Features:**
- Patient Management
- Appointment Scheduling
- Queue Management
- Prescriptions Management
- Invoice & Billing
- Inventory Management
- Reports & Analytics
- Automated Reminders
- Multi-Location Support
- Advanced Reports & Analytics
- Data Export
- Audit Logs

**Limits:**
- Max Users: 20
- Max Patients: 5,000
- Max Storage: 50 GB

---

### 3. Enterprise Plan
**Price:** $199.99/month  
**Description:** Complete solution for large clinics and organizations

**Features:**
- Patient Management
- Appointment Scheduling
- Queue Management
- Prescriptions Management
- Invoice & Billing
- Inventory Management
- Reports & Analytics
- Automated Reminders
- Multi-Location Support
- Telemedicine
- API Access
- Custom Branding
- Priority Support
- Advanced Reports & Analytics
- Data Export
- Audit Logs
- HIPAA/GDPR Compliance
- White Label Solution
- Dedicated Support

**Limits:**
- Max Users: 100
- Max Patients: 50,000
- Max Storage: 500 GB

---

## Available Features

When creating or editing subscription plans, you can include/exclude these features:

1. Patient Management
2. Appointment Scheduling
3. Queue Management
4. Prescriptions Management
5. Invoice & Billing
6. Inventory Management
7. Reports & Analytics
8. Automated Reminders
9. Multi-Location Support
10. Telemedicine
11. API Access
12. Custom Branding
13. Priority Support
14. Advanced Reports & Analytics
15. Data Export
16. Audit Logs
17. HIPAA/GDPR Compliance
18. White Label Solution
19. Dedicated Support

---

## Managing Subscription Plans

### View Plans
Navigate to: `/admin/subscriptions`

### Create New Plan
1. Go to `/admin/subscriptions`
2. Click "+ Create Plan"
3. Fill in plan details
4. Select features using checkboxes
5. Set limits (users, patients, storage)
6. Click "Create Plan"

### Edit Plans
- Plans can be edited directly in the admin interface
- Features can be added or removed using checkboxes

---

## Reseeding Plans

To recreate the three default plans, run:

```bash
npm run seed:plans
```

**Note:** This will skip plans that already exist with the same name.

---

## Next Steps

1. ✅ Three subscription plans created (Basic, Professional, Enterprise)
2. ✅ Feature selection UI improved with checkboxes
3. ⏭️ Connect PayPal integration (if needed)
4. ⏭️ Configure plan limits enforcement
5. ⏭️ Set up feature gating in the application

