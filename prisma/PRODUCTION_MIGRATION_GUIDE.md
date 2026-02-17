# Production Migration Guide (Divergent History)

Your production DB has migrations from Jul-Aug 2025 that don't exist locally. Local has migrations from Feb 2025. This guide fixes the schema **without resetting or dropping** the DB.

---

## Option A: Run the sync migration manually (safest)

### 1. Get the full delta (what prod is missing)

Run against production (with your prod DATABASE_URL):

```bash
DATABASE_URL='your-prod-url' npx prisma migrate diff \
  --from-url "$DATABASE_URL" \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/production_delta.sql
```

### 2. Review `prisma/production_delta.sql`

Check the SQL. It should only ADD missing tables/columns. Look for:
- `CREATE TABLE` – add `IF NOT EXISTS` if missing
- `ALTER TABLE ... ADD COLUMN` – add `IF NOT EXISTS` if supported

### 3. Run the SQL on production

**Option A:** Neon SQL Editor
- Open Neon dashboard → SQL Editor
- Paste the contents of `production_delta.sql`
- Execute

**Option B:** psql
```bash
psql "$DATABASE_URL" -f prisma/production_delta.sql
```

### 4. Mark the migration as applied (optional)

If you want Prisma to know the schema is synced:

```bash
DATABASE_URL='your-prod-url' npx prisma migrate resolve --applied "20250812000000_production_schema_sync"
```

**Note:** `migrate status` will still show "history divergence" because prod has migration records we don't have locally. That's OK – the schema will be correct. For future migrations, see Option B.

---

## Option B: Add prod migrations locally (fix history divergence)

To fully align histories so `prisma migrate deploy` works again:

### 1. Create placeholder migration folders for prod migrations

For each migration listed as "migrations from database are not found locally", create:

```
prisma/migrations/20250716191721_sync_schema/migration.sql
prisma/migrations/20250717143455_add_bank_deposit_slips_json/migration.sql
... (etc.)
```

**Content:** Use a no-op or the minimal SQL that was likely applied. You need these from your prod deploy history (another branch, backup, or git history). Without the original files, checksums will not match and Prisma may refuse to use them.

### 2. Run the schema sync migration

The migration `20250812000000_production_schema_sync` adds:
- `InvoicePayment` table (if missing)
- `usertype` column on `User` (if missing)

Run it manually (Option A above) or try `prisma migrate deploy` after fixing the history.

---

## Quick one-off: Apply just the sync migration

A minimal sync migration was added at:

```
prisma/migrations/20250812000000_production_schema_sync/migration.sql
```

It uses `IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` where possible.

**To apply manually:**
1. Copy the SQL from that file
2. Run it in Neon SQL Editor (or psql) against production
3. Then run: `npx prisma migrate resolve --applied "20250812000000_production_schema_sync"`

---

## Summary

- **Safest:** Run `prisma migrate diff` to get the delta, review it, run it manually on prod.
- **Schema sync file:** `prisma/migrations/20250812000000_production_schema_sync/migration.sql` is a minimal idempotent sync for InvoicePayment and usertype.
- **History:** Divergence will remain until you add the prod migration files locally or reconcile the migration table. The schema can be correct even with divergence.
