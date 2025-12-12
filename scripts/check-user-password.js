/**
 * Script to check user password and diagnose login issues
 * Usage: node scripts/check-user-password.js <email> [password]
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import connectDB from '../lib/db/connection.js';
import User from '../models/User.js';

const email = process.argv[2];
const testPassword = process.argv[3];

if (!email) {
  console.error('Usage: node scripts/check-user-password.js <email> [password]');
  process.exit(1);
}

async function checkUserPassword() {
  try {
    await connectDB();
    console.log('✅ Connected to database\n');

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      console.error(`❌ User with email ${email} not found`);
      process.exit(1);
    }

    console.log('📋 User Information:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Tenant ID: ${user.tenantId || 'N/A'}`);
    console.log(`   Is Active: ${user.isActive}`);
    console.log(`   Password Hash: ${user.password ? user.password.substring(0, 20) + '...' : 'NOT SET'}`);
    console.log(`   Password Hash Length: ${user.password ? user.password.length : 0}`);
    console.log(`   Created At: ${user.createdAt}`);
    console.log(`   Last Login: ${user.lastLoginAt || 'Never'}`);
    console.log(`   Password Changed At: ${user.passwordChangedAt || 'Never'}\n`);

    if (!user.password) {
      console.error('❌ User has no password set!');
      process.exit(1);
    }

    // Check if password hash looks valid (bcrypt hashes start with $2a$, $2b$, or $2y$)
    const hashPrefix = user.password.substring(0, 4);
    if (!['$2a$', '$2b$', '$2y$'].includes(hashPrefix)) {
      console.error(`⚠️  WARNING: Password hash doesn't look like a valid bcrypt hash!`);
      console.error(`   Hash starts with: ${hashPrefix}`);
      console.error(`   Expected: $2a$, $2b$, or $2y$`);
    }

    // If password provided, test it
    if (testPassword) {
      console.log('🔐 Testing Password:');
      console.log(`   Test Password Length: ${testPassword.length}`);
      console.log(`   Test Password (first 3 chars): ${testPassword.substring(0, 3)}***\n`);

      try {
        const isValid = await bcrypt.compare(testPassword, user.password);
        
        if (isValid) {
          console.log('✅ Password is VALID - Login should work!');
        } else {
          console.log('❌ Password is INVALID - Login will fail');
          console.log('\n🔍 Troubleshooting:');
          console.log('   1. Check for extra spaces (leading/trailing)');
          console.log('   2. Check for case sensitivity');
          console.log('   3. Check for special characters encoding');
          console.log('   4. Password might have been changed');
          
          // Try with trimmed password
          const trimmedPassword = testPassword.trim();
          if (trimmedPassword !== testPassword) {
            console.log('\n   Testing with trimmed password...');
            const isValidTrimmed = await bcrypt.compare(trimmedPassword, user.password);
            if (isValidTrimmed) {
              console.log('   ✅ Password is VALID when trimmed! (had whitespace)');
            }
          }
        }
      } catch (error) {
        console.error('❌ Error comparing password:', error.message);
      }
    } else {
      console.log('ℹ️  No password provided for testing');
      console.log('   To test a password, run:');
      console.log(`   node scripts/check-user-password.js ${email} "your-password"`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

checkUserPassword();

