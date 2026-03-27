#!/usr/bin/env node
/**
 * Full backup: Postgres schema + data (custom + plain SQL) + Prisma migrations + schema.prisma.
 * Uses DATABASE_URL from the environment if set; otherwise reads it from project root .env.
 * Never prints the connection string.
 *
 * Usage: node scripts/backup-db-full.cjs
 *        DATABASE_URL="postgresql://..." node scripts/backup-db-full.cjs   # one-off prod URL
 * Requires: pg_dump on PATH (e.g. brew install libpq && brew link --force libpq)
 */

const fs = require('fs');
const path = require('path');
const { execFileSync, execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env');

function loadDatabaseUrl() {
  if (!fs.existsSync(ENV_PATH)) {
    throw new Error(`Missing ${ENV_PATH}`);
  }
  const text = fs.readFileSync(ENV_PATH, 'utf8');
  const match = text.match(/^\s*DATABASE_URL\s*=\s*(.+)$/m);
  if (!match) {
    throw new Error('DATABASE_URL not found in .env');
  }
  let v = match[1].trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  if (!v) throw new Error('DATABASE_URL is empty');
  return v;
}

function whichPgDump() {
  try {
    return execSync('which pg_dump', { encoding: 'utf8' }).trim();
  } catch {
    throw new Error(
      'pg_dump not found. Install: brew install libpq && echo \'export PATH="/opt/homebrew/opt/libpq/bin:$PATH"\' >> ~/.zshrc',
    );
  }
}

function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim() || loadDatabaseUrl();
  const pgDump = whichPgDump();
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const dir = path.join(ROOT, 'backups', `neondb_full_${ts}`);
  fs.mkdirSync(dir, { recursive: true });

  const dumpCustom = path.join(dir, 'database.backup');
  const dumpSql = path.join(dir, 'database.sql');

  console.log('Using pg_dump:', pgDump);
  console.log('Writing to:', dir);

  // Custom format (compressed, parallel restore friendly)
  execFileSync(
    pgDump,
    [
      databaseUrl,
      '--format=custom',
      '--blobs',
      '--no-owner',
      '--no-privileges',
      '--file',
      dumpCustom,
    ],
    { stdio: 'inherit', env: process.env },
  );

  // Plain SQL (human-readable, schema + data)
  execFileSync(
    pgDump,
    [
      databaseUrl,
      '--format=plain',
      '--blobs',
      '--no-owner',
      '--no-privileges',
      '--file',
      dumpSql,
    ],
    { stdio: 'inherit', env: process.env },
  );

  // Prisma artifacts
  const migrationsDest = path.join(dir, 'prisma_migrations');
  fs.cpSync(path.join(ROOT, 'prisma', 'migrations'), migrationsDest, {
    recursive: true,
  });
  fs.copyFileSync(
    path.join(ROOT, 'prisma', 'schema.prisma'),
    path.join(dir, 'schema.prisma'),
  );

  const readme = `Neon / Postgres full backup
Created: ${new Date().toISOString()}

Contents:
- database.backup  — pg_dump custom format (recommended for restore)
- database.sql     — plain SQL (schema + data)
- prisma_migrations/ — copy of prisma/migrations from repo at backup time
- schema.prisma    — copy of prisma/schema.prisma at backup time

Restore custom backup (replace connection string):
  pg_restore --clean --if-exists --no-owner --no-privileges \\
    --dbname="YOUR_DATABASE_URL" \\
    database.backup

Restore plain SQL:
  psql "YOUR_DATABASE_URL" -v ON_ERROR_STOP=1 -f database.sql

Apply Prisma migrations on a fresh DB (instead of restore):
  npx prisma migrate deploy
`;
  fs.writeFileSync(path.join(dir, 'README.txt'), readme, 'utf8');

  const st = fs.statSync(dumpCustom);
  const st2 = fs.statSync(dumpSql);
  console.log('Done.');
  console.log('database.backup size:', (st.size / (1024 * 1024)).toFixed(2), 'MB');
  console.log('database.sql size:', (st2.size / (1024 * 1024)).toFixed(2), 'MB');
}

main();
