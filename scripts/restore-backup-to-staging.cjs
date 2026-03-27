#!/usr/bin/env node
/**
 * Wipes Neon STAGING (host must contain withered-rice-aiookv3k) and restores database.backup.
 * Parses DATABASE_URL from the .env line that references staging (commented or not).
 *
 * Usage: node scripts/restore-backup-to-staging.cjs [path/to/database.backup]
 * Default backup: backups/neondb_full_2026-03-27T09-35-33/database.backup
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const REQUIRED_HOST_SNIPPET = 'withered-rice-aiookv3k';
const FORBIDDEN_HOST_SNIPPETS = ['rough-snow', 'steep-moon'];

const ROOT = path.join(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env');

function extractStagingDatabaseUrl() {
  const text = fs.readFileSync(ENV_PATH, 'utf8');
  const line = text
    .split('\n')
    .find(
      (l) =>
        l.includes(REQUIRED_HOST_SNIPPET) &&
        l.includes('DATABASE_URL'),
    );
  if (!line) {
    throw new Error(
      `.env must contain a DATABASE_URL line with host ${REQUIRED_HOST_SNIPPET}`,
    );
  }
  const withoutComment = line.replace(/^\s*#\s*/, '').trim();
  const eq = withoutComment.indexOf('=');
  if (eq === -1) throw new Error('Invalid DATABASE_URL line');
  let v = withoutComment.slice(eq + 1).trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  return v;
}

function assertStagingOnly(url) {
  if (!url.includes(REQUIRED_HOST_SNIPPET)) {
    throw new Error('Refusing: URL does not look like staging host');
  }
  for (const bad of FORBIDDEN_HOST_SNIPPETS) {
    if (url.includes(bad)) {
      throw new Error(`Refusing: URL contains forbidden prod-like host fragment "${bad}"`);
    }
  }
}

function which(cmd) {
  return require('child_process')
    .execSync(`which ${cmd}`, { encoding: 'utf8' })
    .trim();
}

function main() {
  const backupPath =
    process.argv[2] ||
    path.join(
      ROOT,
      'backups',
      'neondb_full_2026-03-27T09-35-33',
      'database.backup',
    );

  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup not found: ${backupPath}`);
  }

  const stagingUrl = extractStagingDatabaseUrl();
  assertStagingOnly(stagingUrl);

  const psql = which('psql');
  const pgRestore = which('pg_restore');

  console.log('Target verified: staging host (withered-rice).');
  console.log('Backup file:', backupPath);
  console.log('Resetting public schema on staging...');

  execFileSync(
    psql,
    [
      stagingUrl,
      '-v',
      'ON_ERROR_STOP=1',
      '-c',
      'DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public;',
    ],
    { stdio: 'inherit', env: process.env },
  );

  console.log('Restoring from custom-format backup (this may take a while)...');
  execFileSync(
    pgRestore,
    [
      '--no-owner',
      '--no-privileges',
      '--verbose',
      '-d',
      stagingUrl,
      backupPath,
    ],
    { stdio: 'inherit', env: process.env },
  );

  console.log('Staging restore finished.');
}

main();
