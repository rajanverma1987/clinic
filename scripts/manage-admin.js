/**
 * Professional Super Admin Management Script
 * 
 * Best Practices:
 * 1. Proper initialization on first setup
 * 2. Secure password management
 * 3. Account verification and health checks
 * 4. Audit logging
 * 5. Multiple backup admin accounts
 * 
 * Usage:
 *   node scripts/manage-admin.js list
 *   node scripts/manage-admin.js create <email> <firstName> <lastName> <password>
 *   node scripts/manage-admin.js reset <email> <new-password>
 *   node scripts/manage-admin.js verify <email>
 *   node scripts/manage-admin.js health
 */

import connectDB from '../lib/db/connection.js';
import User, { UserRole } from '../models/User.js';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const command = process.argv[2];

async function listAdmins() {
  try {
    await connectDB();
    console.log('📋 Super Admin Accounts:\n');

    const admins = await User.find({ role: UserRole.SUPER_ADMIN })
      .select('+password')
      .sort({ createdAt: 1 });

    if (admins.length === 0) {
      console.log('⚠️  No super admin accounts found!\n');
      console.log('Create one with: npm run admin:create\n');
      return;
    }

    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.firstName} ${admin.lastName}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Active: ${admin.isActive ? '✅' : '❌'}`);
      console.log(`   Created: ${admin.createdAt.toLocaleDateString()}`);
      console.log(`   Last Login: ${admin.lastLoginAt ? admin.lastLoginAt.toLocaleDateString() : 'Never'}`);
      
      // Check password health
      const hasPassword = !!admin.password;
      const isValidHash = hasPassword && 
        (admin.password.startsWith('$2a$') || 
         admin.password.startsWith('$2b$') || 
         admin.password.startsWith('$2y$'));
      
      console.log(`   Password: ${hasPassword ? (isValidHash ? '✅ Valid' : '❌ Invalid Format') : '❌ Missing'}`);
      console.log('');
    });

    console.log(`Total: ${admins.length} super admin account(s)\n`);
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

async function createAdmin() {
  const email = process.argv[3];
  const firstName = process.argv[4];
  const lastName = process.argv[5];
  const password = process.argv[6];

  if (!email || !firstName || !lastName || !password) {
    console.log('\n❌ Usage: node scripts/manage-admin.js create <email> <firstName> <lastName> <password>\n');
    process.exit(1);
  }

  if (password.length < 8) {
    console.log('\n❌ Password must be at least 8 characters long\n');
    process.exit(1);
  }

  try {
    await connectDB();
    console.log('🔐 Creating Super Admin Account...\n');

    // Check if admin already exists
    const existing = await User.findOne({ 
      email: email.toLowerCase(),
      role: UserRole.SUPER_ADMIN 
    });

    if (existing) {
      console.log(`❌ Super admin with email ${email} already exists!\n`);
      await mongoose.connection.close();
      process.exit(1);
    }

    // Create admin
    const admin = await User.create({
      email: email.toLowerCase(),
      password: password,
      firstName: firstName,
      lastName: lastName,
      role: UserRole.SUPER_ADMIN,
      tenantId: null, // Super admins don't have tenantId
      isActive: true,
    });

    // Verify password was hashed correctly
    const createdAdmin = await User.findOne({ _id: admin._id }).select('+password');
    const testResult = await createdAdmin.comparePassword(password);

    if (!testResult) {
      console.error('❌ WARNING: Password was set but validation failed!');
      await User.deleteOne({ _id: admin._id });
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log('✅ Super Admin created successfully!\n');
    console.log(`   Name: ${admin.firstName} ${admin.lastName}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Password: ✅ Verified\n`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

async function resetPassword() {
  const email = process.argv[3];
  const newPassword = process.argv[4];

  if (!email || !newPassword) {
    console.log('\n❌ Usage: node scripts/manage-admin.js reset <email> <new-password>\n');
    process.exit(1);
  }

  if (newPassword.length < 8) {
    console.log('\n❌ Password must be at least 8 characters long\n');
    process.exit(1);
  }

  try {
    await connectDB();
    console.log('🔐 Resetting Super Admin Password...\n');

    const admin = await User.findOne({ 
      email: email.toLowerCase(),
      role: UserRole.SUPER_ADMIN 
    }).select('+password');

    if (!admin) {
      console.log(`❌ Super admin with email ${email} not found!\n`);
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log(`Found: ${admin.firstName} ${admin.lastName} (${admin.email})\n`);

    // Update password
    admin.password = newPassword;
    admin.passwordChangedAt = new Date();
    await admin.save();

    // Verify
    const updatedAdmin = await User.findOne({ _id: admin._id }).select('+password');
    const testResult = await updatedAdmin.comparePassword(newPassword);

    if (!testResult) {
      console.error('❌ WARNING: Password was set but validation failed!');
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log('✅ Password reset successfully!\n');
    console.log(`   Email: ${admin.email}`);
    console.log(`   New Password: ✅ Verified\n`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

async function verifyAdmin() {
  const email = process.argv[3];

  if (!email) {
    console.log('\n❌ Usage: node scripts/manage-admin.js verify <email>\n');
    process.exit(1);
  }

  try {
    await connectDB();
    console.log('🔍 Verifying Super Admin Account...\n');

    const admin = await User.findOne({ 
      email: email.toLowerCase(),
      role: UserRole.SUPER_ADMIN 
    }).select('+password');

    if (!admin) {
      console.log(`❌ Super admin with email ${email} not found!\n`);
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log('✅ Account Found:\n');
    console.log(`   Name: ${admin.firstName} ${admin.lastName}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Active: ${admin.isActive ? '✅' : '❌'}`);
    console.log(`   Tenant ID: ${admin.tenantId || 'N/A (Correct for super admin)'}`);
    console.log(`   Created: ${admin.createdAt.toLocaleDateString()}`);
    console.log(`   Last Login: ${admin.lastLoginAt ? admin.lastLoginAt.toLocaleDateString() : 'Never'}\n`);

    // Password health check
    const hasPassword = !!admin.password;
    const isValidHash = hasPassword && 
      (admin.password.startsWith('$2a$') || 
       admin.password.startsWith('$2b$') || 
       admin.password.startsWith('$2y$'));
    const hashLength = admin.password?.length || 0;

    console.log('🔐 Password Health:\n');
    console.log(`   Exists: ${hasPassword ? '✅' : '❌'}`);
    console.log(`   Format: ${isValidHash ? '✅ Valid bcrypt' : '❌ Invalid'}`);
    console.log(`   Length: ${hashLength} (should be ~60)`);
    
    if (hasPassword && isValidHash) {
      console.log(`   Status: ✅ Account is healthy and ready to use\n`);
    } else {
      console.log(`   Status: ❌ Account needs password reset\n`);
      console.log(`   Fix with: npm run admin:reset ${email} <new-password>\n`);
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

async function healthCheck() {
  try {
    await connectDB();
    console.log('🏥 Super Admin System Health Check\n');

    const admins = await User.find({ role: UserRole.SUPER_ADMIN })
      .select('+password')
      .sort({ createdAt: 1 });

    if (admins.length === 0) {
      console.log('❌ CRITICAL: No super admin accounts found!\n');
      console.log('   Action: Create at least one super admin account\n');
      console.log('   Command: npm run admin:create\n');
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log(`Found ${admins.length} super admin account(s)\n`);

    let healthyCount = 0;
    let issues = [];

    for (const admin of admins) {
      const hasPassword = !!admin.password;
      const isValidHash = hasPassword && 
        (admin.password.startsWith('$2a$') || 
         admin.password.startsWith('$2b$') || 
         admin.password.startsWith('$2y$'));

      if (admin.isActive && hasPassword && isValidHash) {
        healthyCount++;
        console.log(`✅ ${admin.email} - Healthy`);
      } else {
        issues.push({
          email: admin.email,
          active: admin.isActive,
          hasPassword,
          validHash: isValidHash,
        });
        console.log(`❌ ${admin.email} - Issues found`);
      }
    }

    console.log('');

    if (issues.length > 0) {
      console.log('⚠️  Issues Found:\n');
      issues.forEach(issue => {
        console.log(`   ${issue.email}:`);
        if (!issue.active) console.log('      - Account is inactive');
        if (!issue.hasPassword) console.log('      - Password is missing');
        if (!issue.validHash) console.log('      - Password hash is invalid');
        console.log('');
      });
    }

    if (healthyCount === 0) {
      console.log('❌ CRITICAL: No healthy super admin accounts!\n');
      console.log('   Action: Reset passwords for all admin accounts\n');
      await mongoose.connection.close();
      process.exit(1);
    } else if (healthyCount < 2) {
      console.log('⚠️  WARNING: Only one healthy super admin account\n');
      console.log('   Recommendation: Create at least one backup admin account\n');
    } else {
      console.log('✅ System is healthy with multiple admin accounts\n');
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Main command router
switch (command) {
  case 'list':
    await listAdmins();
    break;
  case 'create':
    await createAdmin();
    break;
  case 'reset':
    await resetPassword();
    break;
  case 'verify':
    await verifyAdmin();
    break;
  case 'health':
    await healthCheck();
    break;
  default:
    console.log('\n📖 Super Admin Management\n');
    console.log('Usage:');
    console.log('  npm run admin:list          - List all super admin accounts');
    console.log('  npm run admin:create        - Create a new super admin');
    console.log('  npm run admin:reset         - Reset super admin password');
    console.log('  npm run admin:verify        - Verify admin account health');
    console.log('  npm run admin:health        - System health check\n');
    process.exit(1);
}

