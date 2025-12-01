/**
 * Quick script to create a default super admin account
 * This creates a super admin with predefined credentials for quick setup
 * Run with: npx tsx scripts/create-default-admin.ts
 */

// Load environment variables FIRST - use require to ensure it runs before imports
require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env.local') });
require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });

// Now import modules that depend on environment variables
import connectDB from '../lib/db/connection';
import Tenant from '../models/Tenant';
import User, { UserRole } from '../models/User';

// Default credentials - CHANGE THESE IF NEEDED
const DEFAULT_EMAIL = 'admin@clinic-tool.com';
const DEFAULT_PASSWORD = 'Admin@1234';
const DEFAULT_FIRST_NAME = 'Super';
const DEFAULT_LAST_NAME = 'Admin';
const DEFAULT_TENANT_NAME = 'Admin Tenant';
const DEFAULT_TENANT_SLUG = 'admin-tenant';
const DEFAULT_REGION = 'US';

async function createDefaultAdmin() {
  try {
    console.log('🚀 Creating default super admin account...\n');

    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // Check if super admin already exists
    const existingAdmin = await User.findOne({
      email: DEFAULT_EMAIL.toLowerCase(),
      role: UserRole.SUPER_ADMIN,
    });

    if (existingAdmin) {
      console.log('⚠️  Super admin already exists with email:', DEFAULT_EMAIL);
      console.log('\n💡 To reset password, run: npm run admin:reset');
      console.log('💡 To list all super admins, run: npm run admin:list');
      process.exit(0);
    }

    // Find or create tenant
    let tenant = await Tenant.findOne({ slug: DEFAULT_TENANT_SLUG });

    if (!tenant) {
      console.log('📋 Creating tenant...');
      tenant = await Tenant.create({
        name: DEFAULT_TENANT_NAME,
        slug: DEFAULT_TENANT_SLUG,
        region: DEFAULT_REGION,
        settings: {
          currency: 'USD',
          locale: 'en-US',
          timezone: 'UTC',
        },
        isActive: true,
      });
      console.log(`✅ Tenant created: ${tenant.name}\n`);
    } else {
      console.log(`✅ Using existing tenant: ${tenant.name}\n`);
    }

    // Create super admin
    console.log('👤 Creating super admin...');
    const superAdmin = await User.create({
      email: DEFAULT_EMAIL.toLowerCase(),
      password: DEFAULT_PASSWORD,
      firstName: DEFAULT_FIRST_NAME,
      lastName: DEFAULT_LAST_NAME,
      role: UserRole.SUPER_ADMIN,
      tenantId: tenant._id,
      isActive: true,
    });

    console.log('\n' + '═'.repeat(80));
    console.log('🎉 SUPER ADMIN CREATED SUCCESSFULLY!');
    console.log('═'.repeat(80));
    console.log('\n📧 EMAIL:     ' + DEFAULT_EMAIL);
    console.log('🔑 PASSWORD:  ' + DEFAULT_PASSWORD);
    console.log('👤 NAME:      ' + DEFAULT_FIRST_NAME + ' ' + DEFAULT_LAST_NAME);
    console.log('🆔 USER ID:   ' + superAdmin._id);
    console.log('🏢 TENANT:    ' + tenant.name + ' (' + tenant.slug + ')');
    console.log('\n' + '═'.repeat(80));
    console.log('\n🌐 LOGIN URL: http://localhost:3000/login');
    console.log('\n⚠️  IMPORTANT: Please change the password after first login!');
    console.log('   To reset password: npm run admin:reset\n');

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error creating super admin:', error.message || error);
    if (error.code === 11000) {
      console.error('   This email already exists. Use a different email or reset password.');
    }
    process.exit(1);
  }
}

createDefaultAdmin();
