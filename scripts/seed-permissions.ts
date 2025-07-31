import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Categorized permissions structure
const categorizedPermissions = {
    users: {
        'edit user': 'Edit User',
        'delete user': 'Delete User',
        'view user': 'View User',
        'create user': 'Create User'
    },
    customers: {
        'edit customer': 'Edit Customer',
        'delete customer': 'Delete Customer',
        'view customer': 'View Customer',
        'create customer': 'Create Customer'
    },
    orders: {
        'edit order': 'Edit Order',
        'delete order': 'Delete Order',
        'view order': 'View Order',
        'create order': 'Create Order',
        'process order': 'Process Order',
        'cancel order': 'Cancel Order'
    },
    products: {
        'edit product': 'Edit Product',
        'delete product': 'Delete Product',
        'view product': 'View Product',
        'create product': 'Create Product',
        'manage inventory': 'Manage Inventory'
    },
    categories: {
        'edit category': 'Edit Category',
        'delete category': 'Delete Category',
        'view category': 'View Category',
        'create category': 'Create Category'
    },
    brands: {
        'edit brand': 'Edit Brand',
        'delete brand': 'Delete Brand',
        'view brand': 'View Brand',
        'create brand': 'Create Brand'
    },
    coupons: {
        'edit coupon': 'Edit Coupon',
        'delete coupon': 'Delete Coupon',
        'view coupon': 'View Coupon',
        'create coupon': 'Create Coupon'
    },
    payments: {
        'edit payment': 'Edit Payment',
        'delete payment': 'Delete Payment',
        'view payment': 'View Payment',
        'process payment': 'Process Payment',
        'refund payment': 'Refund Payment'
    },
    shipments: {
        'edit shipment': 'Edit Shipment',
        'delete shipment': 'Delete Shipment',
        'view shipment': 'View Shipment',
        'create shipment': 'Create Shipment',
        'track shipment': 'Track Shipment'
    },
    reports: {
        'view reports': 'View Reports',
        'export reports': 'Export Reports',
        'generate reports': 'Generate Reports'
    },
    settings: {
        'edit settings': 'Edit Settings',
        'view settings': 'View Settings',
        'manage system': 'Manage System'
    }
};

async function seedPermissions() {
    console.log('🌱 Starting permissions seeding...');
    
    try {
        const allPermissions: string[] = [];
        Object.values(categorizedPermissions).forEach(category => {
            Object.keys(category).forEach(permission => {
                allPermissions.push(permission);
            });
        });

        console.log(`📋 Found ${allPermissions.length} permissions to seed`);

        for (const permission of allPermissions) {
            const category = Object.keys(categorizedPermissions).find(cat => 
                categorizedPermissions[cat][permission]
            );
            
            if (!category) {
                console.warn(`⚠️  Could not find category for permission: ${permission}`);
                continue;
            }
            
            const displayName = categorizedPermissions[category][permission];
            
            await prisma.permission.upsert({
                where: { name: permission },
                update: {
                    displayName,
                    category,
                    isActive: true
                },
                create: {
                    name: permission,
                    displayName,
                    category,
                    description: `Permission to ${permission.replace('_', ' ')}`,
                    isActive: true
                }
            });
            
            console.log(`✅ Seeded permission: ${permission}`);
        }
        
        console.log('🎉 Permissions seeding completed successfully!');
        
        // Display summary by category
        console.log('\n📊 Permissions Summary by Category:');
        for (const [category, permissions] of Object.entries(categorizedPermissions)) {
            console.log(`  ${category}: ${Object.keys(permissions).length} permissions`);
        }
        
    } catch (error) {
        console.error('❌ Error seeding permissions:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the seeding
seedPermissions()
    .then(() => {
        console.log('✅ Permissions seeding completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Permissions seeding failed:', error);
        process.exit(1);
    }); 