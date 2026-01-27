/**
 * User Account Reactivation Script
 *
 * This script allows reactivating deactivated user accounts.
 * Useful when users are locked out and cannot log in to reactivate themselves.
 *
 * Usage:
 *   node scripts/reactivate-user.js <email>
 *   node scripts/reactivate-user.js <email> --status (check status only)
 */

import mongoose from 'mongoose';
import connectDB from '../lib/db/connection.js';
import User from '../models/User.js';

const email = process.argv[2];
const checkOnly = process.argv[3] === '--status';

if (!email) {
  console.log('\n❌ Usage: node scripts/reactivate-user.js <email> [--status]\n');
  console.log('Examples:');
  console.log('  node scripts/reactivate-user.js user@example.com');
  console.log('  node scripts/reactivate-user.js user@example.com --status\n');
  process.exit(1);
}

async function reactivateUser() {
  try {
    await connectDB();
    console.log('🔍 Looking up user account...\n');

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      console.log(`❌ User with email ${email} not found!\n`);
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log('✅ User Found:\n');
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Tenant ID: ${user.tenantId || 'N/A'}`);
    console.log(`   Current Status: ${user.isActive ? '✅ Active' : '❌ Deactivated'}`);
    console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
    console.log(
      `   Last Login: ${user.lastLoginAt ? user.lastLoginAt.toLocaleDateString() : 'Never'}\n`
    );

    if (checkOnly) {
      console.log('ℹ️  Status check only. No changes made.\n');
      await mongoose.connection.close();
      return;
    }

    if (user.isActive) {
      console.log('ℹ️  Account is already active. No changes needed.\n');
      await mongoose.connection.close();
      return;
    }

    // Reactivate the account
    console.log('🔄 Reactivating account...\n');
    user.isActive = true;
    await user.save();

    // Verify the change
    const updatedUser = await User.findOne({ _id: user._id });
    if (updatedUser.isActive) {
      console.log('✅ Account reactivated successfully!\n');
      console.log(`   Email: ${updatedUser.email}`);
      console.log(`   Status: ✅ Active`);
      console.log(`   Updated: ${updatedUser.updatedAt.toLocaleDateString()}\n`);
      console.log('ℹ️  User can now log in with their credentials.\n');
    } else {
      console.error('❌ WARNING: Reactivation failed! Account is still deactivated.\n');
      await mongoose.connection.close();
      process.exit(1);
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    await mongoose.connection.close();
    process.exit(1);
  }
}

reactivateUser();
