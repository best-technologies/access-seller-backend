# Prisma Migration Workflow Guide

This guide outlines the proper workflow for managing database schema changes using Prisma migrations to avoid migration errors and database resets.

## 🎯 **Standard Workflow for Schema Changes**

### **1. For Small Changes (adding fields, tables, etc.)**
```bash
npx prisma migrate dev --name descriptive_name_of_change
```

**Examples:**
```bash
npx prisma migrate dev --name add_user_profile_fields
npx prisma migrate dev --name create_notification_table
npx prisma migrate dev --name update_order_status_enum
npx prisma migrate dev --name add_depot_table
```

### **2. For Large Changes or When You're Unsure**
```bash
# First, check what changes will be made
npx prisma migrate dev --create-only --name your_migration_name

# Review the generated migration file in prisma/migrations/
# Then apply it
npx prisma migrate dev
```

### **3. For Production Deployments**
```bash
npx prisma migrate deploy
```

## ❌ **What NOT to Do (to avoid resetting DB)**

- **Don't use `prisma db push`** for schema changes in development
- **Don't manually edit migration files** after they're created
- **Don't delete migration files** from the migrations folder
- **Don't use `prisma migrate reset`** unless absolutely necessary
- **Don't modify existing migrations** that have already been applied

## 🔧 **Best Practices**

### **Before Making Changes:**
1. **Check current status:**
   ```bash
   npx prisma migrate status
   ```

2. **Make sure you're in sync:**
   ```bash
   npx prisma db push
   ```

### **After Making Schema Changes:**
1. **Always use `migrate dev`:**
   ```bash
   npx prisma migrate dev --name descriptive_name
   ```

2. **Generate the client:**
   ```bash
   npx prisma generate
   ```

## 📋 **Quick Reference Commands**

| Command | When to Use | Description |
|---------|-------------|-------------|
| `npx prisma migrate dev --name change_name` | Making schema changes | Creates and applies a new migration |
| `npx prisma migrate status` | Check migration status | Shows current migration state |
| `npx prisma db push` | Sync schema without migrations | Development only, bypasses migration history |
| `npx prisma generate` | Update Prisma client | Regenerates the Prisma client after schema changes |
| `npx prisma migrate deploy` | Deploy to production | Applies pending migrations to production |
| `npx prisma migrate reset` | Reset development database | **Use with caution** - drops all data |

## 💡 **Pro Tips**

1. **Use descriptive migration names** - it helps track changes over time
2. **Always run `migrate dev`** after schema changes
3. **Keep your migrations folder** - never delete it
4. **Test migrations** on a copy of production data first
5. **Review generated migrations** before applying them
6. **Commit migration files** to version control

## 🚨 **Troubleshooting Common Issues**

### **Migration Drift Detected**
If you see "Drift detected" errors:
1. Check if you've manually modified the database
2. Use `npx prisma db push` to sync schema
3. Create a new migration to capture the changes

### **Migration Conflicts**
If migrations conflict:
1. Don't manually edit existing migrations
2. Create a new migration to resolve conflicts
3. Use `npx prisma migrate resolve` if needed

### **Database Out of Sync**
If database is out of sync:
1. Use `npx prisma db push` to sync immediately
2. Create a new migration to capture the state
3. Avoid using `migrate reset` unless necessary

## 📁 **File Structure**

```
prisma/
├── schema.prisma          # Your database schema
├── migrations/            # Migration history (DON'T DELETE)
│   ├── 20240101000000_initial/
│   ├── 20240102000000_add_users/
│   └── ...
└── use-env.js            # Environment configuration
```

## 🔄 **Development Workflow Example**

```bash
# 1. Check current status
npx prisma migrate status

# 2. Make changes to schema.prisma
# (add new fields, tables, etc.)

# 3. Create and apply migration
npx prisma migrate dev --name add_new_feature

# 4. Generate updated client
npx prisma generate

# 5. Test your changes
npm run dev
```

## 🚀 **Production Deployment**

```bash
# 1. Deploy migrations
npx prisma migrate deploy

# 2. Generate client for production
npx prisma generate

# 3. Restart your application
```

## 📝 **Migration Naming Conventions**

Use clear, descriptive names:
- ✅ `add_user_profile_fields`
- ✅ `create_notification_table`
- ✅ `update_order_status_enum`
- ✅ `add_depot_management`
- ❌ `migration_1`
- ❌ `update`

## ⚠️ **Emergency Procedures**

### **If You Must Reset the Database:**
1. **Backup your data first:**
   ```bash
   pg_dump -h localhost -U postgres -d access_sellr_db > backup.sql
   ```

2. **Reset the database:**
   ```bash
   npx prisma migrate reset --force
   ```

3. **Restore your data:**
   ```bash
   psql -h localhost -U postgres -d access_sellr_db -f backup.sql
   ```

---

**Remember:** Always use `npx prisma migrate dev` for schema changes to maintain a clean migration history and avoid database resets! 