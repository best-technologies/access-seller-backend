import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

// Database connection strings
const SOURCE_DB = 'postgresql://access_sellr_prod_db_user:2StEjx19f7vfMNcLKc6Z52vAGin7p1FG@dpg-d1unulmr433s73ev7fsg-a.oregon-postgres.render.com/access_sellr_prod_db';
const TARGET_DB = 'postgresql://neondb_owner:npg_xdpK46YfMSUj@ep-steep-moon-ad5hht4p-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const BACKUP_DIR = path.join(__dirname, '../backups');
const BACKUP_FILE = path.join(BACKUP_DIR, `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.sql`);

async function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`Created backup directory: ${BACKUP_DIR}`);
  }
}

async function createBackup() {
  console.log('Starting database backup...');
  
  try {
    // Create backup using pg_dump
    const backupCommand = `pg_dump "${SOURCE_DB}" --no-owner --no-privileges --clean --if-exists --create > "${BACKUP_FILE}"`;
    
    console.log('Executing backup command...');
    await execAsync(backupCommand);
    
    console.log(`Backup created successfully: ${BACKUP_FILE}`);
    
    // Check file size
    const stats = fs.statSync(BACKUP_FILE);
    console.log(`Backup file size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    
    return BACKUP_FILE;
  } catch (error) {
    console.error('Error creating backup:', error);
    throw error;
  }
}

async function restoreToNeon(backupFile: string) {
  console.log('Starting restore to Neon database...');
  
  try {
    // First, let's check if we can connect to the target database
    console.log('Testing connection to Neon database...');
    await execAsync(`psql "${TARGET_DB}" -c "SELECT version();"`);
    console.log('Connection to Neon database successful');
    
    // Restore the backup
    console.log('Restoring backup to Neon database...');
    const restoreCommand = `psql "${TARGET_DB}" < "${backupFile}"`;
    
    await execAsync(restoreCommand);
    
    console.log('Restore completed successfully!');
  } catch (error) {
    console.error('Error restoring to Neon database:', error);
    throw error;
  }
}

async function verifyRestore() {
  console.log('Verifying restore...');
  
  try {
    // Get table count from source
    const sourceTables = await execAsync(`psql "${SOURCE_DB}" -c "SELECT count(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';"`);
    console.log('Source database tables:', sourceTables.stdout.trim());
    
    // Get table count from target
    const targetTables = await execAsync(`psql "${TARGET_DB}" -c "SELECT count(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';"`);
    console.log('Target database tables:', targetTables.stdout.trim());
    
    // Get row counts for a few key tables (adjust table names as needed)
    const keyTables = ['User', 'Product', 'Order']; // Add your actual table names
    
    for (const table of keyTables) {
      try {
        const sourceCount = await execAsync(`psql "${SOURCE_DB}" -c "SELECT count(*) FROM "${table}";"`);
        const targetCount = await execAsync(`psql "${TARGET_DB}" -c "SELECT count(*) FROM "${table}";"`);
        
        console.log(`Table ${table}:`);
        console.log(`  Source: ${sourceCount.stdout.trim()}`);
        console.log(`  Target: ${targetCount.stdout.trim()}`);
      } catch (error) {
        console.log(`Table ${table}: Not found or error checking`);
      }
    }
    
  } catch (error) {
    console.error('Error during verification:', error);
  }
}

async function main() {
  try {
    console.log('Starting database backup and restore process...');
    console.log(`Source: ${SOURCE_DB.replace(/:[^:]*@/, ':***@')}`);
    console.log(`Target: ${TARGET_DB.replace(/:[^:]*@/, ':***@')}`);
    
    await ensureBackupDir();
    const backupFile = await createBackup();
    await restoreToNeon(backupFile);
    await verifyRestore();
    
    console.log('\n✅ Database backup and restore completed successfully!');
    console.log(`Backup file saved at: ${backupFile}`);
    
  } catch (error) {
    console.error('\n❌ Process failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

export { createBackup, restoreToNeon, verifyRestore };
