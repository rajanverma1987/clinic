/**
 * Seed sample patients for testing
 * Usage: npx tsx scripts/seed-patients.ts
 */

import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import connectDB from '../lib/db/connection';
import Patient from '../models/Patient';
import Tenant from '../models/Tenant';

function getArgValue(name: string) {
  const prefix = `--${name}=`;
  const arg = process.argv.slice(2).find((a) => a.startsWith(prefix));
  return arg ? arg.replace(prefix, '').trim() : undefined;
}

async function listAvailableTenants() {
  const tenants = await Tenant.find()
    .select('name slug _id isActive')
    .lean();

  if (!tenants.length) {
    console.log('No tenants found in the database.');
    return;
  }

  console.log('\nAvailable tenants:\n');
  tenants.forEach((tenant) => {
    console.log(
      `• ${tenant.name}  |  slug: ${tenant.slug}  |  id: ${tenant._id}  |  status: ${tenant.isActive ? 'active' : 'inactive'}`
    );
  });
  console.log('\nUse --tenant=<slug> (or set SEED_TENANT_SLUG) to target a specific tenant.\n');
}

const samplePatients = [
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1-555-0101',
    dateOfBirth: new Date('1985-03-15'),
    gender: 'male',
    bloodGroup: 'O+',
    address: {
      street: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'US',
    },
  },
  {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    phone: '+1-555-0102',
    dateOfBirth: new Date('1990-07-22'),
    gender: 'female',
    bloodGroup: 'A+',
    address: {
      street: '456 Oak Avenue',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90001',
      country: 'US',
    },
  },
  {
    firstName: 'Michael',
    lastName: 'Johnson',
    email: 'michael.j@example.com',
    phone: '+1-555-0103',
    dateOfBirth: new Date('1978-11-30'),
    gender: 'male',
    bloodGroup: 'B+',
    address: {
      street: '789 Pine Road',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60601',
      country: 'US',
    },
  },
  {
    firstName: 'Emily',
    lastName: 'Brown',
    email: 'emily.brown@example.com',
    phone: '+1-555-0104',
    dateOfBirth: new Date('1995-05-18'),
    gender: 'female',
    bloodGroup: 'AB+',
    address: {
      street: '321 Elm Street',
      city: 'Houston',
      state: 'TX',
      zipCode: '77001',
      country: 'US',
    },
  },
  {
    firstName: 'Robert',
    lastName: 'Davis',
    email: 'robert.davis@example.com',
    phone: '+1-555-0105',
    dateOfBirth: new Date('1982-09-25'),
    gender: 'male',
    bloodGroup: 'O-',
    address: {
      street: '654 Maple Drive',
      city: 'Phoenix',
      state: 'AZ',
      zipCode: '85001',
      country: 'US',
    },
  },
  {
    firstName: 'Sarah',
    lastName: 'Wilson',
    email: 'sarah.wilson@example.com',
    phone: '+1-555-0106',
    dateOfBirth: new Date('1988-12-10'),
    gender: 'female',
    bloodGroup: 'A-',
    address: {
      street: '987 Cedar Lane',
      city: 'Philadelphia',
      state: 'PA',
      zipCode: '19101',
      country: 'US',
    },
  },
  {
    firstName: 'David',
    lastName: 'Martinez',
    email: 'david.martinez@example.com',
    phone: '+1-555-0107',
    dateOfBirth: new Date('1975-04-08'),
    gender: 'male',
    bloodGroup: 'B-',
    address: {
      street: '147 Birch Avenue',
      city: 'San Antonio',
      state: 'TX',
      zipCode: '78201',
      country: 'US',
    },
  },
  {
    firstName: 'Lisa',
    lastName: 'Anderson',
    email: 'lisa.anderson@example.com',
    phone: '+1-555-0108',
    dateOfBirth: new Date('1992-08-14'),
    gender: 'female',
    bloodGroup: 'AB-',
    address: {
      street: '258 Willow Court',
      city: 'San Diego',
      state: 'CA',
      zipCode: '92101',
      country: 'US',
    },
  },
  {
    firstName: 'James',
    lastName: 'Taylor',
    email: 'james.taylor@example.com',
    phone: '+1-555-0109',
    dateOfBirth: new Date('1980-02-28'),
    gender: 'male',
    bloodGroup: 'O+',
    address: {
      street: '369 Spruce Street',
      city: 'Dallas',
      state: 'TX',
      zipCode: '75201',
      country: 'US',
    },
  },
  {
    firstName: 'Maria',
    lastName: 'Garcia',
    email: 'maria.garcia@example.com',
    phone: '+1-555-0110',
    dateOfBirth: new Date('1987-06-19'),
    gender: 'female',
    bloodGroup: 'A+',
    address: {
      street: '741 Ash Boulevard',
      city: 'San Jose',
      state: 'CA',
      zipCode: '95101',
      country: 'US',
    },
  },
];

async function generatePatientId(tenantId: string, index: number): Promise<string> {
  // Get the last patient number for this tenant
  const lastPatient = await Patient.findOne(
    { tenantId },
    { patientId: 1 }
  )
    .sort({ patientId: -1 })
    .lean();

  let nextNum = index + 1;

  if (lastPatient) {
    const patientId = (lastPatient as any).patientId;
    if (patientId) {
      const match = patientId.match(/(\d+)$/);
      if (match) {
        nextNum = parseInt(match[1], 10) + index + 1;
      }
    }
  }

  return `PAT-${nextNum.toString().padStart(4, '0')}`;
}

async function resolveTenant() {
  const tenantSlug = process.env.SEED_TENANT_SLUG || getArgValue('tenant');
  const tenantId = process.env.SEED_TENANT_ID || getArgValue('tenantId');

  if (tenantSlug || tenantId) {
    const query: Record<string, any> = {};
    if (tenantSlug) query.slug = tenantSlug;
    if (tenantId) query._id = tenantId;

    const tenant = await Tenant.findOne(query).lean();
    if (!tenant) {
      console.error(
        `❌ No tenant found for ${tenantSlug ? `slug "${tenantSlug}" ` : ''}${tenantId ? `id "${tenantId}"` : ''}`
      );
      await listAvailableTenants();
      process.exit(1);
    }

    return tenant;
  }

  const activeTenants = await Tenant.find({ isActive: true })
    .select('name slug _id')
    .lean();

  if (activeTenants.length === 0) {
    console.error('❌ No active tenants found. Please register a clinic first.');
    process.exit(1);
  }

  if (activeTenants.length === 1) {
    return activeTenants[0];
  }

  console.warn('⚠️  Multiple active tenants found. Please specify which tenant to seed using --tenant=<slug>.');
  await listAvailableTenants();
  process.exit(1);
}

async function seedPatients() {
  try {
    console.log('🔌 Connecting to database...');
    await connectDB();

    console.log('🔍 Resolving tenant...');
    const tenant = await resolveTenant();

    console.log(`✅ Seeding tenant: ${(tenant as any).name} (${tenant.slug}) [${tenant._id}]`);

    console.log('\n👥 Seeding patients...\n');

    let created = 0;
    let skipped = 0;

    for (let i = 0; i < samplePatients.length; i++) {
      const patientData = samplePatients[i];

      // Check if patient already exists (by email or phone)
      const existingPatient = await Patient.findOne({
        tenantId: tenant._id,
        $or: [
          { email: patientData.email },
          { phone: patientData.phone },
        ],
      });

      if (existingPatient) {
        console.log(
          `⏭️  Skipped: ${patientData.firstName} ${patientData.lastName} (already exists for tenant ${tenant.slug})`
        );
        skipped++;
        continue;
      }

      // Generate unique patient ID
      const patientId = await generatePatientId(tenant._id.toString(), i);

      // Create patient
      const patient = await Patient.create({
        ...patientData,
        tenantId: tenant._id,
        patientId,
        isActive: true,
      });

      console.log(`✅ Created: ${patientData.firstName} ${patientData.lastName} (${patientId})`);
      created++;
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Created: ${created} patients`);
    console.log(`   ⏭️  Skipped: ${skipped} patients (already exist)`);
    console.log(`   📋 Total: ${created + skipped} patients processed\n`);

    console.log('✨ Patient seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding patients:', error);
    process.exit(1);
  }
}

// Run the seeder
seedPatients();

