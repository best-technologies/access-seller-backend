/**
 * Audit action types. Add new types as needed - no schema change required.
 */
export const AuditActionType = {
  // Auth
  LOGIN: 'login',
  LOGOUT: 'logout',
  LOGIN_FAILED: 'login_failed',
  REGISTER: 'register',
  RESET_PASSWORD_REQUEST: 'reset_password_request',
  RESET_PASSWORD_COMPLETE: 'reset_password_complete',
  ADMIN_LOGIN_OTP_REQUEST: 'admin_login_otp_request',
  ADMIN_LOGIN_OTP_VERIFY: 'admin_login_otp_verify',

  // Distribution - Consignment
  CREATE_CONSIGNMENT: 'create_consignment',
  UPDATE_CONSIGNMENT: 'update_consignment',
  CREATE_CONSIGNMENT_DOCUMENT: 'create_consignment_document',

  // Distribution - Bulk Order
  CREATE_BULK_ORDER: 'create_bulk_order',
  UPDATE_BULK_ORDER: 'update_bulk_order',
  BULK_ORDER_PAYMENT: 'bulk_order_payment',

  // Warehouse / User
  ONBOARD_WAREHOUSE_ADMIN: 'onboard_warehouse_admin',
  EDIT_USER_PERMISSIONS: 'edit_user_permissions',
} as const;

export type AuditActionTypeValue = (typeof AuditActionType)[keyof typeof AuditActionType];
