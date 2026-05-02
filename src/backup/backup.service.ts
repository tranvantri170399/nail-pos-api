import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDir = './backups';

  constructor(private configService: ConfigService) {
    this.ensureBackupDirectory();
  }

  private ensureBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async scheduledBackup() {
    this.logger.log('Starting scheduled database backup...');
    await this.createBackup();
  }

  async createBackup(): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `backup-${timestamp}.sql`;
      const filepath = path.join(this.backupDir, filename);

      const dbHost = this.configService.get<string>('DB_HOST');
      const dbPort = this.configService.get<number>('DB_PORT');
      const dbUsername = this.configService.get<string>('DB_USERNAME');
      const dbPassword = this.configService.get<string>('DB_PASSWORD');
      const dbDatabase = this.configService.get<string>('DB_DATABASE');

      const command = `PGPASSWORD=${dbPassword} pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUsername} -d ${dbDatabase} > ${filepath}`;

      await execAsync(command);

      // Clean up old backups (keep last 7 days)
      await this.cleanupOldBackups();

      this.logger.log(`Backup created successfully: ${filename}`);
      return filepath;
    } catch (error) {
      this.logger.error('Backup failed:', error);
      throw error;
    }
  }

  async cleanupOldBackups() {
    try {
      const files = fs.readdirSync(this.backupDir);
      const backupFiles = files.filter(f => f.startsWith('backup-') && f.endsWith('.sql'));
      
      // Sort by date (newest first)
      backupFiles.sort((a, b) => b.localeCompare(a));

      // Keep only the last 7 backups
      const filesToDelete = backupFiles.slice(7);

      for (const file of filesToDelete) {
        const filepath = path.join(this.backupDir, file);
        fs.unlinkSync(filepath);
        this.logger.log(`Deleted old backup: ${file}`);
      }
    } catch (error) {
      this.logger.error('Error cleaning up old backups:', error);
    }
  }

  async listBackups(): Promise<string[]> {
    try {
      const files = fs.readdirSync(this.backupDir);
      return files.filter(f => f.startsWith('backup-') && f.endsWith('.sql'));
    } catch (error) {
      this.logger.error('Error listing backups:', error);
      return [];
    }
  }

  async restoreBackup(filename: string): Promise<void> {
    try {
      const filepath = path.join(this.backupDir, filename);
      
      if (!fs.existsSync(filepath)) {
        throw new Error(`Backup file not found: ${filename}`);
      }

      const dbHost = this.configService.get<string>('DB_HOST');
      const dbPort = this.configService.get<number>('DB_PORT');
      const dbUsername = this.configService.get<string>('DB_USERNAME');
      const dbPassword = this.configService.get<string>('DB_PASSWORD');
      const dbDatabase = this.configService.get<string>('DB_DATABASE');

      const command = `PGPASSWORD=${dbPassword} psql -h ${dbHost} -p ${dbPort} -U ${dbUsername} -d ${dbDatabase} < ${filepath}`;

      await execAsync(command);
      this.logger.log(`Database restored successfully from: ${filename}`);
    } catch (error) {
      this.logger.error('Restore failed:', error);
      throw error;
    }
  }
}
