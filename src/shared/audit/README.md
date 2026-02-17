# Audit Log

Central audit logging for security and compliance. Tracks user actions across the application.

## Schema

| Field       | Type     | Description                                      |
|------------|----------|--------------------------------------------------|
| id         | String   | Unique ID                                        |
| actionType | String   | Action type (see AuditActionType)                |
| userId     | String?  | Who performed (nullable for failed login, etc.)  |
| userEmail  | String?  | Email at time of action (for display)            |
| userName   | String?  | Full name at time of action                      |
| entityType | String?  | Affected entity: consignment, bulk_order, user   |
| entityId   | String?  | ID of affected record                            |
| description| String?  | Human-readable summary                           |
| metadata   | Json?    | Extra context (ip, old/new values, etc.)         |
| ipAddress  | String?  | Client IP                                        |
| userAgent  | String?  | Client user agent                                |
| createdAt  | DateTime | When the action occurred                         |

## Usage

Inject `AuditService` and call `log()`:

```typescript
import { AuditService } from 'src/shared/audit/audit.service';
import { AuditActionType } from 'src/shared/audit/audit.types';

// In your service/controller
await this.auditService.log({
  actionType: AuditActionType.CREATE_CONSIGNMENT,
  userId: user.id,
  userEmail: user.email,
  userName: `${user.first_name} ${user.last_name}`,
  entityType: 'consignment',
  entityId: consignment.id,
  description: `Created consignment ${consignment.referenceNumber}`,
  metadata: { supplierName: consignment.supplierName, itemCount: consignment.items.length },
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
});
```

## Action Types

Add new types in `audit.types.ts` as needed—no schema migration required.

| Type                    | Description                    |
|-------------------------|--------------------------------|
| login                   | User signed in                 |
| logout                  | User signed out                |
| login_failed            | Failed login attempt           |
| register                | New user registered            |
| reset_password_request  | Password reset OTP requested   |
| reset_password_complete | Password reset completed       |
| create_consignment      | New consignment created        |
| update_consignment      | Consignment updated            |
| create_bulk_order       | New bulk order created         |
| onboard_warehouse_admin | Warehouse admin onboarded      |
| ...                     | Add more as you go             |
