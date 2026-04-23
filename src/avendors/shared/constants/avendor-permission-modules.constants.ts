/**
 * A-Vendor admin UI modules (Figma). Keys match Prisma `AvendorPermission` columns.
 */
export const AVENDOR_PERMISSION_MODULE_META = [
  {
    key: 'vendors_management',
    label: 'Vendors Management',
    description: 'Add or remove supplier, and track compliance docs.',
  },
  {
    key: 'inventory',
    label: 'Inventory',
    description: 'Add and monitor material.',
  },
  {
    key: 'rfqs',
    label: 'RFQs',
    description:
      'Request price from vendors and compare quotes to find the best deal.',
  },
  {
    key: 'order_management',
    label: 'Order Management',
    description:
      'Create purchase orders, approve transactions, and track deliveries.',
  },
  {
    key: 'invoice',
    label: 'Invoice',
    description:
      'Review bills and match them against orders to ensure accuracy.',
  },
  {
    key: 'payment',
    label: 'Payment',
    description: 'Manage and upload payment receipts.',
  },
  {
    key: 'onboarding',
    label: 'Onboarding',
    description: 'Invite users, assign roles, and manage permissions.',
  },
] as const;
