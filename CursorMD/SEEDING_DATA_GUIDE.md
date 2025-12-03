# Data Seeding Guide
## Quick Setup with Sample Data

---

## Overview

Seed scripts help you quickly populate your database with sample data for testing and development.

---

## Available Seeders

### 1. ✅ Subscription Plans

**Script**: `seed-subscription-plans.ts`  
**Command**: `npm run seed:plans`

**Creates**:
- Free Trial (15 days)
- Basic Plan ($29/month)
- Professional Plan ($79/month)
- Enterprise Plan ($199/month)

**Status**: ✅ Already seeded

---

### 2. ✅ Sample Patients (NEW!)

**Script**: `seed-patients.ts`  
**Command**: `npm run seed:patients -- --tenant=<tenant-slug>`

**Creates**: 10 sample patients with realistic data

**Patients Seeded**:
```
✅ John Doe (PAT-0001) - Male, O+, DOB: 1985-03-15
✅ Jane Smith (PAT-0003) - Female, A+, DOB: 1990-07-22
✅ Michael Johnson (PAT-0006) - Male, B+, DOB: 1978-11-30
✅ Emily Brown (PAT-0010) - Female, AB+, DOB: 1995-05-18
✅ Robert Davis (PAT-0015) - Male, O-, DOB: 1982-09-25
✅ Sarah Wilson (PAT-0021) - Female, A-, DOB: 1988-12-10
✅ David Martinez (PAT-0028) - Male, B-, DOB: 1975-04-08
✅ Lisa Anderson (PAT-0036) - Female, AB-, DOB: 1992-08-14
✅ James Taylor (PAT-0045) - Male, O+, DOB: 1980-02-28
✅ Maria Garcia (PAT-0055) - Female, A+, DOB: 1987-06-19
```

**Status**: ✅ Just seeded!

---

## Usage

### Seed Patients

```bash
npm run seed:patients -- --tenant=<tenant-slug>
# Example
npm run seed:patients -- --tenant=city-clinic
```

> 💡 Tip: set `SEED_TENANT_SLUG=city-clinic` in `.env.local` to avoid retyping the flag.

Need to know your clinic slug? List all tenants:

```bash
node -r dotenv/config node_modules/.bin/tsx -e "import connectDB from './lib/db/connection'; import Tenant from './models/Tenant'; (async () => { await connectDB(); const tenants = await Tenant.find().select('name slug _id isActive').lean(); console.log(tenants); process.exit(0); })();" dotenv_config_path=.env.local
```

**Output**:
```
🔌 Connecting to database...
🔍 Finding first active tenant...
✅ Found tenant: Rajan (692dd205fa37746d44e234b8)

👥 Seeding patients...

✅ Created: 10 patients
⏭️  Skipped: 0 patients (already exist)

✨ Patient seeding completed!
```

### Seed Subscription Plans

```bash
npm run seed:plans
```

### Setup PayPal Plans

```bash
npm run setup:paypal-plans
```

---

## What Each Patient Has

### Complete Profile:
- ✅ **Unique Patient ID** (PAT-0001, PAT-0002, etc.)
- ✅ **Full Name** (First + Last)
- ✅ **Contact** (Email + Phone)
- ✅ **Date of Birth** (realistic ages)
- ✅ **Gender** (Male/Female mix)
- ✅ **Blood Group** (All types: O+, A+, B+, AB+, O-, A-, B-, AB-)
- ✅ **Complete Address** (Street, City, State, ZIP, Country)

### Sample Data:
```typescript
{
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1-555-0101',
  dateOfBirth: 1985-03-15,
  gender: 'male',
  bloodGroup: 'O+',
  address: {
    street: '123 Main Street',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'US'
  }
}
```

---

## Features

### Smart Seeding

1. **Checks for Duplicates**:
   - Won't create if email or phone already exists
   - Skips and shows count

2. **Auto-generates Patient IDs**:
   - Sequential numbering
   - Continues from last patient ID
   - Format: PAT-0001, PAT-0002, etc.

3. **Tenant-Aware**:
   - Finds your active tenant automatically
   - Associates patients with correct clinic

---

## Verify Seeded Data

### 1. Check Patients Page

```
http://localhost:5053/patients

Should show:
- John Doe (PAT-0001)
- Jane Smith (PAT-0003)
- Michael Johnson (PAT-0006)
... and 7 more
```

### 2. Test Patient Selector

```
http://localhost:5053/appointments/new

Click "Select Patient" dropdown:
- Should show all 10 patients
- Search should work
- Can select any patient
```

### 3. Check in Database

```bash
# Using MongoDB shell
mongosh

use clinic-tool  # or your database name

db.patients.find({ patientId: /PAT-/ }).count()
# Should return 10 (or more if you ran multiple times)

db.patients.find({}, { patientId: 1, firstName: 1, lastName: 1 })
# Shows all seeded patients
```

---

## Re-running the Seeder

### Safe to Re-run (per tenant)

```bash
npm run seed:patients -- --tenant=<tenant-slug>
```

**What happens**:
- Checks for duplicates (by email/phone)
- Skips existing patients
- Only creates new ones
- Shows summary

**Example Output**:
```
✅ Created: 0 patients
⏭️  Skipped: 10 patients (already exist)
📋 Total: 10 patients processed
```

---

## Customizing Sample Data

### Edit the Script

**File**: `/scripts/seed-patients.ts`

**Add More Patients**:
```typescript
const samplePatients = [
  // ... existing patients
  {
    firstName: 'Your',
    lastName: 'Patient',
    email: 'your.patient@example.com',
    phone: '+1-555-0199',
    dateOfBirth: new Date('1990-01-01'),
    gender: 'male',
    bloodGroup: 'O+',
    address: {
      street: '123 Your Street',
      city: 'Your City',
      state: 'YS',
      zipCode: '12345',
      country: 'US',
    },
  },
];
```

**Run Again**:
```bash
npm run seed:patients -- --tenant=<tenant-slug>
```

---

## All Seeder Commands

```bash
# Setup (first time only)
npm run setup

# Seed subscription plans
npm run seed:plans

# Seed sample patients (NEW!)
npm run seed:patients -- --tenant=<tenant-slug>

# Setup PayPal plans
npm run setup:paypal-plans

# Create admin user
npm run admin:create
```

---

## Benefits

### ✅ Quick Testing
- No need to manually add patients
- Ready-to-use data
- Realistic information

### ✅ Development
- Test pagination
- Test search functionality
- Test appointments with real data

### ✅ Demos
- Professional presentation
- Complete patient profiles
- Show all features

---

## Summary

✅ **Created**: Patient seeder script  
✅ **Seeded**: 10 sample patients  
✅ **Available**: `npm run seed:patients`  
✅ **Smart**: Checks for duplicates  
✅ **Realistic**: Complete patient profiles  
✅ **Ready**: Test appointments, queue, prescriptions  

**Your database now has sample patients for testing!** 🎉👥

