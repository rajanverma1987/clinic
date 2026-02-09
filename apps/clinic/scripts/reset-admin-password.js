/**
 * Script to reset a user's password
 *
 * Usage:
 *   node scripts/reset-admin-password.js <email> <new-password>
 */

import connectDB from '../lib/db/connection.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

async function resetPassword() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.log('\n❌ Usage: node scripts/reset-admin-password.js <email> <new-password>\n');
    process.exit(1);
  }

  if (newPassword.length < 8) {
    console.log('\n❌ Password must be at least 8 characters long\n');
    process.exit(1);
  }

  try {
    await connectDB();
    console.log('✅ Connected to database\n');

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log(`❌ User with email "${email}" not found\n`);
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log(`Found user: ${user.firstName} ${user.lastName} (${user.role})`);
    console.log(`Email: ${user.email}`);
    console.log(`Active: ${user.isActive}`);
    console.log(`Tenant ID: ${user.tenantId || 'N/A (Super Admin)'}\n`);

    // Get old password hash for comparison
    const oldPasswordHash = user.password ? user.password.substring(0, 20) + '...' : 'NOT SET';
    console.log(`Old password hash: ${oldPasswordHash}`);

    // Update password
    console.log('\nUpdating password...');
    user.password = newPassword;
    await user.save();

    // Verify the password was hashed correctly
    const updatedUser = await User.findOne({ email: email.toLowerCase() }).select('+password');
    const newPasswordHash = updatedUser.password ? updatedUser.password.substring(0, 20) + '...' : 'NOT SET';
    const hashPrefix = updatedUser.password ? updatedUser.password.substring(0, 4) : 'N/A';
    
    console.log(`New password hash: ${newPasswordHash}`);
    console.log(`Hash format: ${hashPrefix} (should be $2a$, $2b$, or $2y$)`);
    
    // Test the password
    const testResult = await updatedUser.comparePassword(newPassword);
    console.log(`Password test result: ${testResult ? '✅ VALID' : '❌ INVALID'}\n`);

    if (!testResult) {
      console.error('❌ WARNING: Password was set but validation test failed!');
      console.error('This indicates a problem with password hashing.\n');
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log('✅ Password updated and verified successfully!\n');
    console.log(`You can now login with:`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Password: ${newPassword}\n`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

resetPassword();
