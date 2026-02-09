/**
 * Quick script to create a default super admin
 * Useful for initial setup or emergency access
 * 
 * Usage: node scripts/create-default-admin.js
 */

import connectDB from '../lib/db/connection.js';
import User, { UserRole } from '../models/User.js';
import mongoose from 'mongoose';

async function createDefaultAdmin() {
  try {
    await connectDB();
    console.log('🚀 Creating Default Super Admin...\n');

    const defaultEmail = 'admin@clinic.com';
    const defaultPassword = 'Admin@1234';

    // Check if already exists
    const existing = await User.findOne({ 
      email: defaultEmail.toLowerCase(),
      role: UserRole.SUPER_ADMIN 
    });

    if (existing) {
      console.log(`⚠️  Default admin already exists: ${defaultEmail}\n`);
      console.log('   To reset password, use: npm run admin:reset\n');
      await mongoose.connection.close();
      return;
    }

    // Create default admin
    const admin = await User.create({
      email: defaultEmail.toLowerCase(),
      password: defaultPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.SUPER_ADMIN,
      tenantId: null,
      isActive: true,
    });

    // Verify
    const createdAdmin = await User.findOne({ _id: admin._id }).select('+password');
    const testResult = await createdAdmin.comparePassword(defaultPassword);

    if (!testResult) {
      console.error('❌ WARNING: Password validation failed!');
      await User.deleteOne({ _id: admin._id });
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log('✅ Default Super Admin created!\n');
    console.log('📧 Login Credentials:');
    console.log(`   Email: ${defaultEmail}`);
    console.log(`   Password: ${defaultPassword}\n`);
    console.log('⚠️  IMPORTANT: Change this password immediately after first login!\n');

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createDefaultAdmin();

