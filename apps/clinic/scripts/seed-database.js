/**
 * Database Seed Script
 * Seeds initial data for development/testing
 * Based on NEW-PLANS.md requirements
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const User = require('../models/User').default || require('../models/User');
const Tenant = require('../models/Tenant').default || require('../models/Tenant');
const Department = require('../models/Department').default || require('../models/Department');
const Doctor = require('../models/Doctor').default || require('../models/Doctor');
const LabTest = require('../models/LabTest').default || require('../models/LabTest');
const SubscriptionPlan =
  require('../models/SubscriptionPlan').default || require('../models/SubscriptionPlan');
const { getFeaturesForTier } = require('../lib/constants/plan-features.js');

const MONGODB_URI = process.env.MONGODB_URI;

// Plans: Core / Pro / Enterprise. USD only; price in cents. Payment: PayPal only.
const PLAN_TIERS = [
  {
    name: 'FREE',
    price: 0,
    currency: 'USD',
    tierIndex: 0,
    description: 'Solo doctors testing the system or very small practice',
    maxUsers: 1,
    maxPatients: 25,
    maxStorageGB: 0,
    isHidden: true,
  },
  {
    name: 'Core',
    price: 2499, // $24.99 in cents
    currency: 'USD',
    tierIndex: 1,
    description: 'For Solo / Small Clinics',
    maxUsers: 3,
    maxPatients: 999999,
    maxStorageGB: 10,
    trialDays: 14,
  },
  {
    name: 'Pro',
    price: 5999, // $59.99 in cents
    currency: 'USD',
    tierIndex: 2,
    description: 'For Growing Clinics',
    maxUsers: 10,
    maxPatients: 999999,
    maxStorageGB: 50,
    isPopular: true,
  },
  {
    name: 'Enterprise',
    price: 12999, // $129.99 in cents
    currency: 'USD',
    tierIndex: 3,
    description: 'For Advanced / Multi-location Clinics',
    maxUsers: 999,
    maxPatients: 999999,
    maxStorageGB: 9999,
  },
];

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in .env.local');
  process.exit(1);
}

/**
 * Seed subscription plans: Core / Pro / Enterprise. USD only, MONTHLY. Payment: PayPal only.
 */
async function seedSubscriptionPlans() {
  console.log('📦 Seeding subscription plans (Core / Pro / Enterprise, USD)...');

  for (const tier of PLAN_TIERS) {
    const existing = await SubscriptionPlan.findOne({ name: tier.name });
    const features = getFeaturesForTier(tier.tierIndex);
    const planData = {
      name: tier.name,
      description: tier.description,
      price: tier.price,
      currency: tier.currency || 'USD',
      billingCycle: 'MONTHLY',
      features,
      maxUsers: tier.maxUsers,
      maxPatients: tier.maxPatients,
      maxStorageGB: tier.maxStorageGB,
      isPopular: tier.isPopular || false,
      isHidden: tier.isHidden ?? false,
      trialDays: tier.trialDays ?? undefined,
    };
    if (!existing) {
      await SubscriptionPlan.create(planData);
      console.log(
        `  ✅ Created plan: ${tier.name} ($${(tier.price / 100).toFixed(2)}/mo ${tier.currency}, ${features.length} features)`,
      );
    } else {
      await SubscriptionPlan.updateOne(
        { name: tier.name },
        {
          $set: {
            description: tier.description,
            price: tier.price,
            currency: tier.currency || 'USD',
            features,
            maxUsers: tier.maxUsers,
            maxPatients: tier.maxPatients,
            maxStorageGB: tier.maxStorageGB,
            isPopular: tier.isPopular || false,
            isHidden: tier.isHidden ?? false,
            trialDays: tier.trialDays ?? undefined,
          },
        },
      );
      console.log(
        `  🔄 Updated plan: ${tier.name} ($${(tier.price / 100).toFixed(2)} ${tier.currency}, ${features.length} features)`,
      );
    }
  }
}

/**
 * Seed common lab tests
 */
async function seedLabTests(tenantId) {
  console.log('🧪 Seeding lab tests...');

  const labTests = [
    {
      tenantId,
      testCode: 'CBC',
      name: 'Complete Blood Count',
      category: 'Hematology',
      sampleType: 'blood',
      parameters: [
        {
          name: 'Hemoglobin',
          unit: 'g/dL',
          referenceRange: { min: 12, max: 16 },
        },
        {
          name: 'White Blood Cell Count',
          unit: 'cells/µL',
          referenceRange: { min: 4000, max: 11000 },
        },
      ],
      pricing: { price: 25 },
      tatHours: 24,
      status: 'active',
    },
    {
      tenantId,
      testCode: 'LIPID',
      name: 'Lipid Profile',
      category: 'Chemistry',
      sampleType: 'blood',
      parameters: [
        {
          name: 'Total Cholesterol',
          unit: 'mg/dL',
          referenceRange: { min: 0, max: 200 },
        },
        {
          name: 'HDL Cholesterol',
          unit: 'mg/dL',
          referenceRange: { min: 40, max: 100 },
        },
      ],
      pricing: { price: 30 },
      tatHours: 24,
      status: 'active',
    },
    {
      tenantId,
      testCode: 'URINE',
      name: 'Urine Analysis',
      category: 'Urinalysis',
      sampleType: 'urine',
      parameters: [
        {
          name: 'pH',
          unit: '',
          referenceRange: { min: 5, max: 7 },
        },
      ],
      pricing: { price: 15 },
      tatHours: 4,
      status: 'active',
    },
  ];

  for (const testData of labTests) {
    const existing = await LabTest.findOne({ tenantId, testCode: testData.testCode });
    if (!existing) {
      await LabTest.create(testData);
      console.log(`  ✅ Created lab test: ${testData.name}`);
    } else {
      console.log(`  ⏭️  Lab test already exists: ${testData.name}`);
    }
  }
}

/**
 * Seed departments
 */
async function seedDepartments(tenantId) {
  console.log('🏥 Seeding departments...');

  const departments = [
    { name: 'General Medicine', code: 'GEN', description: 'General medical consultations' },
    { name: 'Cardiology', code: 'CARD', description: 'Heart and cardiovascular care' },
    { name: 'Pediatrics', code: 'PED', description: 'Child healthcare' },
    { name: 'Orthopedics', code: 'ORTH', description: 'Bone and joint care' },
    { name: 'Dermatology', code: 'DERM', description: 'Skin care' },
  ];

  for (const deptData of departments) {
    const existing = await Department.findOne({ tenantId, code: deptData.code });
    if (!existing) {
      await Department.create({ ...deptData, tenantId });
      console.log(`  ✅ Created department: ${deptData.name}`);
    } else {
      console.log(`  ⏭️  Department already exists: ${deptData.name}`);
    }
  }
}

/**
 * Seed demo tenant and users
 */
async function seedDemoData() {
  console.log('👥 Seeding demo tenant and users...');

  // Create demo tenant
  let tenant = await Tenant.findOne({ name: 'Demo Clinic' });
  if (!tenant) {
    tenant = await Tenant.create({
      name: 'Demo Clinic',
      slug: 'demo-clinic',
      region: 'US',
      registrationNumber: 'DEMO-001',
      contact: {
        phone: '+1234567890',
        email: 'demo@clinic.com',
        address: {
          street: '123 Demo Street',
          city: 'Demo City',
          state: 'Demo State',
          zip: '12345',
          country: 'USA',
        },
      },
      settings: {
        timezone: 'America/New_York',
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
      },
      isActive: true,
    });
    console.log('  ✅ Created demo tenant');
  } else {
    console.log('  ⏭️  Demo tenant already exists');
  }

  // Create super admin
  const superAdminEmail = 'superadmin@clinic.com';
  let superAdmin = await User.findOne({ email: superAdminEmail });
  if (!superAdmin) {
    const hashedPassword = await bcrypt.hash('SuperAdmin123!', 12);
    superAdmin = await User.create({
      email: superAdminEmail,
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'super_admin',
      isActive: true,
      status: 'active',
    });
    console.log(
      '  ✅ Created super admin (email: superadmin@clinic.com, password: SuperAdmin123!)',
    );
  } else {
    console.log('  ⏭️  Super admin already exists');
  }

  // Create clinic admin
  const clinicAdminEmail = 'admin@clinic.com';
  let clinicAdmin = await User.findOne({ email: clinicAdminEmail, tenantId: tenant._id });
  if (!clinicAdmin) {
    const hashedPassword = await bcrypt.hash('Admin123!', 12);
    clinicAdmin = await User.create({
      tenantId: tenant._id,
      email: clinicAdminEmail,
      password: hashedPassword,
      firstName: 'Clinic',
      lastName: 'Admin',
      role: 'clinic_admin',
      isActive: true,
      status: 'active',
    });
    console.log('  ✅ Created clinic admin (email: admin@clinic.com, password: Admin123!)');
  } else {
    console.log('  ⏭️  Clinic admin already exists');
  }

  // Create demo doctor
  const doctorEmail = 'doctor@clinic.com';
  let doctor = await User.findOne({ email: doctorEmail, tenantId: tenant._id });
  if (!doctor) {
    const hashedPassword = await bcrypt.hash('Doctor123!', 12);
    doctor = await User.create({
      tenantId: tenant._id,
      email: doctorEmail,
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Doctor',
      role: 'doctor',
      isActive: true,
      status: 'active',
    });

    // Create doctor profile
    const genDept = await Department.findOne({ tenantId: tenant._id, code: 'GEN' });
    if (genDept) {
      await Doctor.create({
        tenantId: tenant._id,
        userId: doctor._id,
        professional: {
          licenseNumber: 'MD-12345',
          specialization: ['General Medicine'],
          qualification: 'MD',
          experienceYears: 10,
          languages: ['English'],
        },
        schedule: {
          workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          slots: [
            {
              day: 'monday',
              startTime: '09:00',
              endTime: '17:00',
              slotDuration: 30,
            },
          ],
        },
        consultationFee: 100,
        departments: [genDept._id],
        status: 'active',
      });
    }
    console.log('  ✅ Created demo doctor (email: doctor@clinic.com, password: Doctor123!)');
  } else {
    console.log('  ⏭️  Demo doctor already exists');
  }

  return tenant;
}

/**
 * Main seed function
 */
async function seed() {
  try {
    console.log('🌱 Starting database seed...\n');

    // Connect to database
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Seed subscription plans (no tenant required)
    await seedSubscriptionPlans();
    console.log('');

    // Seed demo data (creates tenant and users)
    const tenant = await seedDemoData();
    console.log('');

    // Seed departments
    if (tenant) {
      await seedDepartments(tenant._id);
      console.log('');

      // Seed lab tests
      await seedLabTests(tenant._id);
      console.log('');
    }

    console.log('✅ Database seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run seed
seed();
