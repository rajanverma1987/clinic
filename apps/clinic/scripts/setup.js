/**
 * Clinic SaaS Setup Script
 *
 * This script helps you set up your clinic application for the first time.
 * It will create:
 * 1. A tenant (clinic)
 * 2. A super admin user
 *
 * Usage:
 *   npm run setup
 */

import connectDB from '../lib/db/connection.js';
import Tenant from '../models/Tenant.js';
import User, { UserRole } from '../models/User.js';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setup() {
  try {
    console.log('\n🏥 Clinic SaaS Setup\n');
    console.log('This script will help you set up your clinic application.\n');

    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // Check if there are existing tenants
    const existingTenants = await Tenant.countDocuments();
    const existingAdmins = await User.countDocuments({ role: UserRole.SUPER_ADMIN });

    if (existingTenants > 0 && existingAdmins > 0) {
      console.log('⚠️  Setup already completed!');
      console.log(`   Found ${existingTenants} tenant(s) and ${existingAdmins} super admin(s)\n`);

      const proceed = await question('Do you want to create another tenant and admin? (y/N): ');
      if (proceed.toLowerCase() !== 'y') {
        console.log('\nSetup cancelled.\n');
        rl.close();
        await mongoose.connection.close();
        process.exit(0);
      }
    }

    console.log('\n📋 Step 1: Create Tenant (Clinic)\n');

    const tenantName = await question('Tenant Name (e.g., "My Clinic"): ');
    if (!tenantName.trim()) {
      console.log('\n❌ Tenant name is required\n');
      rl.close();
      await mongoose.connection.close();
      process.exit(1);
    }

    const tenantSlug = await question(`Tenant Slug (e.g., "my-clinic") [${tenantName.toLowerCase().replace(/[^a-z0-9]/g, '-')}]: `);
    const slug = tenantSlug.trim() || tenantName.toLowerCase().replace(/[^a-z0-9]/g, '-');

    const region = await question('Region (US/EU/APAC/IN/ME/CA/AU) [US]: ');
    const tenantRegion = region.trim().toUpperCase() || 'US';

    if (!['US', 'EU', 'APAC', 'IN', 'ME', 'CA', 'AU'].includes(tenantRegion)) {
      console.log('\n❌ Invalid region. Must be one of: US, EU, APAC, IN, ME, CA, AU\n');
      rl.close();
      await mongoose.connection.close();
      process.exit(1);
    }

    // Check if slug already exists
    const existingTenant = await Tenant.findOne({ slug });
    if (existingTenant) {
      console.log(`\n❌ A tenant with slug "${slug}" already exists\n`);
      rl.close();
      await mongoose.connection.close();
      process.exit(1);
    }

    // Create tenant
    const tenant = await Tenant.create({
      name: tenantName.trim(),
      slug,
      region: tenantRegion,
      settings: {
        currency: tenantRegion === 'US' ? 'USD' : tenantRegion === 'EU' ? 'EUR' : 'USD',
        locale: tenantRegion === 'US' ? 'en-US' : 'en-US',
        timezone: 'UTC',
      }
    });

    console.log(`\n✅ Tenant created: ${tenant.name} (${tenant.slug})`);
    console.log(`   ID: ${tenant._id}\n`);

    console.log('\n📋 Step 2: Create Super Admin User\n');

    const adminEmail = await question('Admin Email: ');
    if (!adminEmail.trim() || !adminEmail.includes('@')) {
      console.log('\n❌ Valid email is required\n');
      rl.close();
      await mongoose.connection.close();
      process.exit(1);
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: adminEmail.toLowerCase().trim() });
    if (existingUser) {
      console.log(`\n❌ A user with email "${adminEmail}" already exists\n`);
      rl.close();
      await mongoose.connection.close();
      process.exit(1);
    }

    const adminFirstName = await question('First Name: ');
    const adminLastName = await question('Last Name: ');
    const adminPassword = await question('Password (min 8 characters): ');

    if (!adminFirstName.trim() || !adminLastName.trim()) {
      console.log('\n❌ First name and last name are required\n');
      rl.close();
      await mongoose.connection.close();
      process.exit(1);
    }

    if (!adminPassword || adminPassword.length < 8) {
      console.log('\n❌ Password must be at least 8 characters\n');
      rl.close();
      await mongoose.connection.close();
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create super admin (no tenantId required)
    const admin = await User.create({
      email: adminEmail.toLowerCase().trim(),
      password: hashedPassword,
      firstName: adminFirstName.trim(),
      lastName: adminLastName.trim(),
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      status: 'active',
    });

    console.log(`\n✅ Super Admin created: ${admin.firstName} ${admin.lastName}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   ID: ${admin._id}\n`);

    console.log('\n🎉 Setup Complete!\n');
    console.log('You can now start the development server:');
    console.log('   npm run dev\n');
    console.log('And login at: http://localhost:5053/login\n');

    rl.close();
    await mongoose.connection.close();
  } catch (error) {
    console.error('\n❌ Error during setup:', error.message);
    console.error(error);
    rl.close();
    await mongoose.connection.close();
    process.exit(1);
  }
}

setup();
