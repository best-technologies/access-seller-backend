import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PermissionsService {
    private readonly logger = new Logger(PermissionsService.name);
    
    constructor(private prisma: PrismaService) {}

    // Categorized permissions structure
    private readonly categorizedPermissions = {
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

    // Get all categorized permissions
    getCategorizedPermissions() {
        return this.categorizedPermissions;
    }

    // Get all permissions as flat array
    getAllPermissions(): string[] {
        const allPermissions: string[] = [];
        Object.values(this.categorizedPermissions).forEach(category => {
            Object.keys(category).forEach(permission => {
                allPermissions.push(permission);
            });
        });
        return allPermissions;
    }

    // Get permissions by category
    getPermissionsByCategory(category: string): Record<string, string> | null {
        return this.categorizedPermissions[category] || null;
    }

    // Get available categories
    getAvailableCategories(): string[] {
        return Object.keys(this.categorizedPermissions);
    }

    // Validate if a permission exists
    isValidPermission(permission: string): boolean {
        return this.getAllPermissions().includes(permission);
    }

    // Get display name for a permission
    getPermissionDisplayName(permission: string): string | null {
        for (const category of Object.values(this.categorizedPermissions)) {
            if (category[permission]) {
                return category[permission];
            }
        }
        return null;
    }

    // Get category for a permission
    getPermissionCategory(permission: string): string | null {
        for (const [category, permissions] of Object.entries(this.categorizedPermissions)) {
            if (permissions[permission]) {
                return category;
            }
        }
        return null;
    }

    // Seed permissions to database
    async seedPermissions() {
        this.logger.log('Seeding permissions to database...');
        
        try {
            const allPermissions = this.getAllPermissions();
            
            for (const permission of allPermissions) {
                const category = this.getPermissionCategory(permission);
                const displayName = this.getPermissionDisplayName(permission);
                
                if (!category || !displayName) {
                    this.logger.warn(`Skipping permission ${permission} - missing category or display name`);
                    continue;
                }
                
                await this.prisma.permission.upsert({
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
            }
            
            this.logger.log(`Successfully seeded ${allPermissions.length} permissions`);
        } catch (error) {
            this.logger.error('Error seeding permissions:', error);
            throw error;
        }
    }

    // Get user permissions with categories
    async getUserPermissionsWithCategories(userId: string) {
        try {
            const userPermissions = await this.prisma.userPermission.findMany({
                where: { userId },
                include: {
                    permission: true
                }
            });

            const categorizedPermissions: Record<string, any[]> = {};
            
            userPermissions.forEach(userPermission => {
                const category = userPermission.permission.category;
                if (!categorizedPermissions[category]) {
                    categorizedPermissions[category] = [];
                }
                
                categorizedPermissions[category].push({
                    id: userPermission.permission.id,
                    name: userPermission.permission.name,
                    displayName: userPermission.permission.displayName,
                    grantedAt: userPermission.grantedAt,
                    grantedBy: userPermission.grantedBy
                });
            });

            return categorizedPermissions;
        } catch (error) {
            this.logger.error('Error getting user permissions with categories:', error);
            throw error;
        }
    }

    // Get all permissions from database with categories
    async getAllPermissionsFromDatabase() {
        try {
            const permissions = await this.prisma.permission.findMany({
                where: { isActive: true },
                orderBy: [{ category: 'asc' }, { displayName: 'asc' }]
            });

            const categorizedPermissions: Record<string, any[]> = {};
            
            permissions.forEach(permission => {
                if (!categorizedPermissions[permission.category]) {
                    categorizedPermissions[permission.category] = [];
                }
                
                categorizedPermissions[permission.category].push({
                    id: permission.id,
                    name: permission.name,
                    displayName: permission.displayName,
                    description: permission.description
                });
            });

            return categorizedPermissions;
        } catch (error) {
            this.logger.error('Error getting all permissions from database:', error);
            throw error;
        }
    }
} 