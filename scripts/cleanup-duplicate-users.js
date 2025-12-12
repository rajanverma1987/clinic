/**
 * Cleanup script for duplicate users
 *
 * This script:
 * 1. Finds all users with duplicate emails
 * 2. For each duplicate set, keeps the most recent active user
 * 3. Deactivates or deletes the older duplicates
 *
 * Usage:
 *   node scripts/cleanup-duplicate-users.js --dry-run  (preview changes)
 *   node scripts/cleanup-duplicate-users.js --execute  (apply changes)
 */

import connectDB from '../lib/db/connection.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

const DRY_RUN = process.argv.includes('--dry-run');
const EXECUTE = process.argv.includes('--execute');

async function findDuplicateUsers() {
  const duplicates = await User.aggregate([
    {
      $group: {
        _id: { email: '$email' },
        count: { $sum: 1 },
        users: {
          $push: {
            id: '$_id',
            email: '$email',
            firstName: '$firstName',
            lastName: '$lastName',
            role: '$role',
            tenantId: '$tenantId',
            isActive: '$isActive',
            createdAt: '$createdAt',
            lastLoginAt: '$lastLoginAt',
          },
        },
      },
    },
    {
      $match: {
        count: { $gt: 1 },
      },
    },
    {
      $sort: { '_id.email': 1 },
    },
  ]);

  return duplicates;
}

function selectUserToKeep(users) {
  // Priority logic for which user to keep:
  // 1. Active users over inactive
  // 2. Most recently logged in
  // 3. Most recently created

  const sorted = [...users].sort((a, b) => {
    // Active users first
    if (a.isActive !== b.isActive) {
      return b.isActive ? 1 : -1;
    }

    // Then by last login
    if (a.lastLoginAt && b.lastLoginAt) {
      return new Date(b.lastLoginAt) - new Date(a.lastLoginAt);
    }
    if (a.lastLoginAt) return -1;
    if (b.lastLoginAt) return 1;

    // Finally by creation date
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return sorted[0];
}

async function cleanupDuplicates() {
  console.log('\n=== Duplicate User Cleanup Script ===\n');

  if (!DRY_RUN && !EXECUTE) {
    console.log('Please specify --dry-run or --execute');
    console.log('  --dry-run: Preview changes without applying them');
    console.log('  --execute: Apply the changes to the database');
    process.exit(1);
  }

  await connectDB();
  console.log('Connected to database\n');

  const duplicates = await findDuplicateUsers();

  if (duplicates.length === 0) {
    console.log('No duplicate users found!');
    await mongoose.connection.close();
    return;
  }

  console.log(`Found ${duplicates.length} email(s) with duplicates:\n`);

  let totalToRemove = 0;
  const removalPlan = [];

  for (const duplicate of duplicates) {
    const email = duplicate._id.email;
    const users = duplicate.users;
    const userToKeep = selectUserToKeep(users);
    const usersToRemove = users.filter(u => u.id.toString() !== userToKeep.id.toString());

    console.log(`\nEmail: ${email} (${users.length} duplicates)`);
    console.log(`  KEEP: ${userToKeep.firstName} ${userToKeep.lastName} (${userToKeep.role})`);
    console.log(`        ID: ${userToKeep.id}`);
    console.log(`        Tenant: ${userToKeep.tenantId || 'N/A'}`);
    console.log(`        Active: ${userToKeep.isActive}`);
    console.log(`        Created: ${new Date(userToKeep.createdAt).toISOString()}`);
    console.log(`        Last Login: ${userToKeep.lastLoginAt ? new Date(userToKeep.lastLoginAt).toISOString() : 'Never'}`);

    console.log(`\n  REMOVE (${usersToRemove.length}):`);
    for (const user of usersToRemove) {
      console.log(`    - ${user.firstName} ${user.lastName} (${user.role})`);
      console.log(`      ID: ${user.id}`);
      console.log(`      Tenant: ${user.tenantId || 'N/A'}`);
      console.log(`      Active: ${user.isActive}`);
      console.log(`      Created: ${new Date(user.createdAt).toISOString()}`);
      console.log(`      Last Login: ${user.lastLoginAt ? new Date(user.lastLoginAt).toISOString() : 'Never'}`);

      removalPlan.push(user.id);
    }

    totalToRemove += usersToRemove.length;
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Summary: ${totalToRemove} duplicate user(s) will be removed`);
  console.log(`${'='.repeat(60)}\n`);

  if (EXECUTE) {
    console.log('Executing cleanup...');

    try {
      const result = await User.deleteMany({
        _id: { $in: removalPlan.map(id => mongoose.Types.ObjectId.createFromHexString(id.toString())) }
      });

      console.log(`Successfully removed ${result.deletedCount} duplicate user(s)`);
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  } else {
    console.log('DRY RUN - No changes applied');
    console.log('Run with --execute to apply these changes');
  }

  await mongoose.connection.close();
  console.log('\nDatabase connection closed');
}

cleanupDuplicates().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});
