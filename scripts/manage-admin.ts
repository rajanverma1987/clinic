/**
 * Admin Management Script
 * This script helps you manage super admin accounts
 * 
 * Usage:
 *   npx tsx scripts/manage-admin.ts list        - List all super admin users
 *   npx tsx scripts/manage-admin.ts create      - Create a new super admin
 *   npx tsx scripts/manage-admin.ts reset       - Reset password for existing super admin
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

async function listSuperAdmins() {
  try {
    await connectDB();
    console.log('🔍 Fetching super admin users...\n');

    const superAdmins = await User.find({ role: UserRole.SUPER_ADMIN })
      .select('email firstName lastName isActive tenantId createdAt')
      .populate('tenantId', 'name slug')
      .lean();

    if (superAdmins.length === 0) {
      console.log('❌ No super admin users found.\n');
      console.log('💡 Run: npx tsx scripts/manage-admin.ts create\n');
      return;
    }

    console.log(`✅ Found ${superAdmins.length} super admin user(s):\n`);
    console.log('─'.repeat(80));
    
    superAdmins.forEach((admin, index) => {
      console.log(`\n${index + 1}. Email: ${admin.email}`);
      console.log(`   Name: ${admin.firstName} ${admin.lastName}`);
      console.log(`   Status: ${admin.isActive ? '✅ Active' : '❌ Inactive'}`);
      if (admin.tenantId) {
        const tenant = admin.tenantId as any;
        console.log(`   Tenant: ${tenant.name} (${tenant.slug})`);
      }
      console.log(`   Created: ${new Date(admin.createdAt).toLocaleString()}`);
    });
    
    console.log('\n' + '─'.repeat(80));
    console.log('\n💡 To reset password, run: npx tsx scripts/manage-admin.ts reset\n');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    rl.close();
  }
}

async function createSuperAdmin() {
  try {
    await connectDB();
    console.log('👤 Creating new super admin...\n');

    // Check if we should use existing tenant or create new one
    const useExisting = await question('Do you want to use an existing tenant? (y/n): ');
    let tenantId: any;

    if (useExisting.toLowerCase() === 'y') {
      const tenantSlug = await question('Enter tenant slug: ');
      const tenant = await Tenant.findOne({ slug: tenantSlug });
      if (!tenant) {
        console.log('❌ Tenant not found!');
        process.exit(1);
      }
      tenantId = tenant._id;
      console.log(`✅ Using tenant: ${tenant.name}\n`);
    } else {
      console.log('\n📋 Creating new tenant...');
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

      tenantId = tenant._id;
      console.log(`✅ Tenant created: ${tenant.name}\n`);
    }

    // Create super admin
    const email = await question('Super admin email: ');
    const password = await question('Super admin password (min 8 chars): ');
    const firstName = await question('First name: ');
    const lastName = await question('Last name: ');

    // Check if user already exists
    const existing = await User.findOne({
      email: email.toLowerCase(),
      tenantId: tenantId,
    });

    if (existing) {
      console.log('❌ User with this email already exists in this tenant!');
      process.exit(1);
    }

    const superAdmin = await User.create({
      email: email.toLowerCase(),
      password,
      firstName,
      lastName,
      role: UserRole.SUPER_ADMIN,
      tenantId: tenantId,
      isActive: true,
    });

    console.log('\n🎉 Super admin created successfully!');
    console.log('\n' + '─'.repeat(80));
    console.log(`📧 Email: ${email}`);
    console.log(`👤 Name: ${firstName} ${lastName}`);
    console.log(`🆔 User ID: ${superAdmin._id}`);
    console.log('─'.repeat(80));
    console.log('\n✅ You can now login at: http://localhost:3000/login\n');
  } catch (error: any) {
    console.error('❌ Error:', error.message || error);
    if (error.code === 11000) {
      console.error('   Email already exists in this tenant.');
    }
  } finally {
    rl.close();
  }
}

async function resetPassword() {
  try {
    await connectDB();
    console.log('🔐 Reset super admin password...\n');

    const email = await question('Enter super admin email: ');

    const user = await User.findOne({
      email: email.toLowerCase(),
      role: UserRole.SUPER_ADMIN,
    }).select('+password');

    if (!user) {
      console.log('❌ Super admin user not found with that email!');
      console.log('💡 Run: npx tsx scripts/manage-admin.ts list\n');
      process.exit(1);
    }

    console.log(`\n✅ Found user: ${user.firstName} ${user.lastName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Status: ${user.isActive ? 'Active' : 'Inactive'}\n`);

    const confirm = await question('Are you sure you want to reset the password? (y/n): ');
    if (confirm.toLowerCase() !== 'y') {
      console.log('Cancelled.');
      process.exit(0);
    }

    const newPassword = await question('Enter new password (min 8 chars): ');
    const confirmPassword = await question('Confirm new password: ');

    if (newPassword !== confirmPassword) {
      console.log('❌ Passwords do not match!');
      process.exit(1);
    }

    if (newPassword.length < 8) {
      console.log('❌ Password must be at least 8 characters!');
      process.exit(1);
    }

    user.password = newPassword;
    await user.save();

    console.log('\n✅ Password reset successfully!');
    console.log(`\n📧 Email: ${user.email}`);
    console.log('✅ You can now login with the new password at: http://localhost:3000/login\n');
  } catch (error: any) {
    console.error('❌ Error:', error.message || error);
  } finally {
    rl.close();
  }
}

// Main execution
const command = process.argv[2];

switch (command) {
  case 'list':
    listSuperAdmins();
    break;
  case 'create':
    createSuperAdmin();
    break;
  case 'reset':
    resetPassword();
    break;
  default:
    console.log('🔧 Admin Management Script\n');
    console.log('Usage:');
    console.log('  npx tsx scripts/manage-admin.ts list     - List all super admin users');
    console.log('  npx tsx scripts/manage-admin.ts create   - Create a new super admin');
    console.log('  npx tsx scripts/manage-admin.ts reset    - Reset password for existing super admin');
    console.log('\n');
    process.exit(1);
}

