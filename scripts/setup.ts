/**
 * Setup script to create initial tenant and super admin
 * Run with: npx tsx scripts/setup.ts
 */

// Load environment variables FIRST - use require to ensure it runs before imports
require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env.local') });
require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });

// Now import modules that depend on environment variables
import connectDB from '../lib/db/connection';
import Tenant from '../models/Tenant';
import User, { UserRole } from '../models/User';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function setup() {
  try {
    console.log('🚀 Setting up Clinic Management System...\n');

    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // Create tenant
    console.log('📋 Creating tenant...');
    const tenantName = await question('Tenant name: ');
    const tenantSlug = await question('Tenant slug (URL-friendly, e.g., city-clinic): ');
    const region = await question('Region (US/EU/APAC/IN/ME/CA/AU): ');

    const tenant = await Tenant.create({
      name: tenantName,
      slug: tenantSlug,
      region: region.toUpperCase(),
      settings: {
        currency: 'USD',
        locale: 'en-US',
        timezone: 'UTC',
      },
      isActive: true,
    });

    console.log(`✅ Tenant created: ${tenant._id}\n`);

    // Create super admin
    console.log('👤 Creating super admin...');
    const email = await question('Super admin email: ');
    const password = await question('Super admin password (min 8 chars): ');
    const firstName = await question('First name: ');
    const lastName = await question('Last name: ');

    const superAdmin = await User.create({
      email: email.toLowerCase(),
      password,
      firstName,
      lastName,
      role: UserRole.SUPER_ADMIN,
      tenantId: tenant._id,
      isActive: true,
    });

    console.log(`✅ Super admin created: ${superAdmin._id}\n`);

    console.log('🎉 Setup complete!');
    console.log(`\nTenant ID: ${tenant._id}`);
    console.log(`Super Admin Email: ${email}`);
    console.log('\nYou can now login at: POST /api/auth/login');

    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

setup();

