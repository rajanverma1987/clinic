/**
 * Backup Manager
 * Centralized backup management with scheduling and rotation
 * Based on NEW-PLANS.md requirements
 */

import { createBackup, cleanupOldBackups, verifyBackup } from '../../scripts/backup-database.js';

export class BackupManager {
  constructor(options = {}) {
    this.backupDir = options.backupDir || process.env.BACKUP_DIR;
    this.retentionDays = options.retentionDays || parseInt(process.env.BACKUP_RETENTION_DAYS || '7', 10);
    this.schedule = options.schedule || {
      daily: { hour: 2, minute: 0 }, // 2 AM daily
      weekly: { day: 0, hour: 3, minute: 0 }, // Sunday 3 AM
      monthly: { day: 1, hour: 4, minute: 0 }, // 1st of month 4 AM
    };
  }

  /**
   * Create a backup
   */
  async createBackup(type = 'daily') {
    process.env.BACKUP_TYPE = type;
    return await createBackup();
  }

  /**
   * Cleanup old backups
   */
  async cleanup() {
    return await cleanupOldBackups();
  }

  /**
   * Verify backup integrity
   */
  async verify(backupPath) {
    return await verifyBackup(backupPath);
  }

  /**
   * Get backup statistics
   */
  async getStats() {
    const fs = await import('fs/promises');
    const path = await import('path');

    try {
      const files = await fs.readdir(this.backupDir);
      const backups = files.filter((f) => f.endsWith('.tar.gz'));

      let totalSize = 0;
      const byType = {
        daily: 0,
        weekly: 0,
        monthly: 0,
      };

      for (const file of backups) {
        const filePath = path.join(this.backupDir, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;

        if (file.includes('daily')) byType.daily++;
        else if (file.includes('weekly')) byType.weekly++;
        else if (file.includes('monthly')) byType.monthly++;
      }

      return {
        total: backups.length,
        totalSize,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
        byType,
      };
    } catch (error) {
      throw new Error(`Failed to get backup stats: ${error.message}`);
    }
  }
}

export default BackupManager;
