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
const SubscriptionPlan = require('../models/SubscriptionPlan').default || require('../models/SubscriptionPlan');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in .env.local');
  process.exit(1);
}

/**
 * Seed subscription plans
 */
async function seedSubscriptionPlans() {
  console.log('📦 Seeding subscription plans...');
  
  const plans = [
    {
      name: 'Free',
      description: 'Basic features for small clinics',
      price: 0,
      currency: 'USD',
      billingCycle: 'monthly',
      features: [
        'Patient Management',
        'Appointment Scheduling',
        'Basic Reports',
      ],
      limits: {
        maxDoctors: 1,
        maxPatients: 100,
        maxAppointments: 500,
      },
      isActive: true,
    },
    {
      name: 'Basic',
      description: 'Essential features for growing clinics',
      price: 49,
      currency: 'USD',
      billingCycle: 'monthly',
      features: [
        'Patient Management',
        'Appointment Scheduling',
        'Prescriptions',
        'Basic Reports',
        'Email Notifications',
      ],
      limits: {
        maxDoctors: 3,
        maxPatients: 500,
        maxAppointments: 2000,
      },
      isActive: true,
    },
    {
      name: 'Professional',
      description: 'Advanced features for established clinics',
      price: 149,
      currency: 'USD',
      billingCycle: 'monthly',
      features: [
        'Patient Management',
        'Appointment Scheduling',
        'Prescriptions',
        'Lab Orders & Results',
        'Advanced Reports',
        'SMS/Email Notifications',
        'Inventory Management',
        'Multi-Location Support',
      ],
      limits: {
        maxDoctors: 10,
        maxPatients: 2000,
        maxAppointments: 10000,
      },
      isActive: true,
    },
    {
      name: 'Enterprise',
      description: 'Full-featured solution for large clinics',
      price: 399,
      currency: 'USD',
      billingCycle: 'monthly',
      features: [
        'All Professional Features',
        'Telemedicine',
        'API Access',
        'Custom Branding',
        'Priority Support',
        'Advanced Analytics',
        'Audit Logs',
        'Data Export',
      ],
      limits: {
        maxDoctors: -1, // Unlimited
        maxPatients: -1, // Unlimited
        maxAppointments: -1, // Unlimited
      },
      isActive: true,
    },
  ];

  for (const planData of plans) {
    const existing = await SubscriptionPlan.findOne({ name: planData.name });
    if (!existing) {
      await SubscriptionPlan.create(planData);
      console.log(`  ✅ Created plan: ${planData.name}`);
    } else {
      console.log(`  ⏭️  Plan already exists: ${planData.name}`);
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
    console.log('  ✅ Created super admin (email: superadmin@clinic.com, password: SuperAdmin123!)');
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
