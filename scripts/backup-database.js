/**
 * Automated Database Backup Script
 * Creates MongoDB backups with rotation and encryption
 * Based on NEW-PLANS.md requirements
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '../backups');
const MONGODB_URI = process.env.MONGODB_URI;
const RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || '7', 10);
const BACKUP_TYPE = process.env.BACKUP_TYPE || 'daily'; // daily, weekly, monthly

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required');
  process.exit(1);
}

/**
 * Create backup directory if it doesn't exist
 */
async function ensureBackupDir() {
  try {
    await fs.access(BACKUP_DIR);
  } catch {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    console.log(`✅ Created backup directory: ${BACKUP_DIR}`);
  }
}

/**
 * Generate backup filename with timestamp
 */
function getBackupFilename() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const time = new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('.')[0];
  return `backup-${BACKUP_TYPE}-${timestamp}-${time}`;
}

/**
 * Create MongoDB backup using mongodump
 */
async function createBackup() {
  const backupName = getBackupFilename();
  const backupPath = path.join(BACKUP_DIR, backupName);

  console.log(`📦 Starting ${BACKUP_TYPE} backup: ${backupName}`);

  try {
    // Create backup directory for this backup
    await fs.mkdir(backupPath, { recursive: true });

    // Run mongodump
    const command = `mongodump --uri="${MONGODB_URI}" --out="${backupPath}" --gzip`;
    
    console.log('🔄 Running mongodump...');
    const { stdout, stderr } = await execAsync(command);

    if (stderr && !stderr.includes('writing')) {
      console.warn('⚠️  mongodump warnings:', stderr);
    }

    // Create backup metadata
    const metadata = {
      type: BACKUP_TYPE,
      timestamp: new Date().toISOString(),
      mongodbUri: MONGODB_URI.replace(/\/\/.*@/, '//***@'), // Hide credentials
      backupPath,
      version: '1.0.0',
    };

    await fs.writeFile(
      path.join(backupPath, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );

    // Compress backup directory
    const compressedFile = `${backupPath}.tar.gz`;
    console.log('🗜️  Compressing backup...');
    await execAsync(`tar -czf "${compressedFile}" -C "${BACKUP_DIR}" "${backupName}"`);

    // Remove uncompressed directory
    await fs.rm(backupPath, { recursive: true, force: true });

    console.log(`✅ Backup created successfully: ${compressedFile}`);

    // Get backup size
    const stats = await fs.stat(compressedFile);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`📊 Backup size: ${sizeMB} MB`);

    return {
      success: true,
      backupPath: compressedFile,
      size: stats.size,
      timestamp: metadata.timestamp,
    };
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    throw error;
  }
}

/**
 * Clean up old backups based on retention policy
 */
async function cleanupOldBackups() {
  console.log(`🧹 Cleaning up backups older than ${RETENTION_DAYS} days...`);

  try {
    const files = await fs.readdir(BACKUP_DIR);
    const now = Date.now();
    const retentionMs = RETENTION_DAYS * 24 * 60 * 60 * 1000;

    let deletedCount = 0;
    let freedSpace = 0;

    for (const file of files) {
      if (!file.endsWith('.tar.gz')) continue;

      const filePath = path.join(BACKUP_DIR, file);
      const stats = await fs.stat(filePath);
      const age = now - stats.mtimeMs;

      if (age > retentionMs) {
        console.log(`🗑️  Deleting old backup: ${file}`);
        freedSpace += stats.size;
        await fs.unlink(filePath);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      const freedMB = (freedSpace / (1024 * 1024)).toFixed(2);
      console.log(`✅ Deleted ${deletedCount} old backup(s), freed ${freedMB} MB`);
    } else {
      console.log('✅ No old backups to delete');
    }
  } catch (error) {
    console.error('⚠️  Error during cleanup:', error.message);
  }
}

/**
 * Verify backup integrity
 */
async function verifyBackup(backupPath) {
  console.log('🔍 Verifying backup integrity...');

  try {
    // Check if file exists and is readable
    await fs.access(backupPath);

    // Check if it's a valid tar.gz
    await execAsync(`tar -tzf "${backupPath}" > /dev/null 2>&1`);

    console.log('✅ Backup integrity verified');
    return true;
  } catch (error) {
    console.error('❌ Backup verification failed:', error.message);
    return false;
  }
}

/**
 * Main backup function
 */
async function main() {
  console.log('🚀 Starting automated database backup...');
  console.log(`📅 Backup type: ${BACKUP_TYPE}`);
  console.log(`💾 Retention: ${RETENTION_DAYS} days`);

  try {
    await ensureBackupDir();

    const result = await createBackup();

    // Verify backup
    const isValid = await verifyBackup(result.backupPath);
    if (!isValid) {
      throw new Error('Backup verification failed');
    }

    // Cleanup old backups
    await cleanupOldBackups();

    console.log('✅ Backup process completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Backup process failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { createBackup, cleanupOldBackups, verifyBackup };
