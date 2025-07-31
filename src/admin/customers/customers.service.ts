import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as colors from 'colors';
import { Prisma } from '@prisma/client';
import { GetCustomersDto, GetUserForEditDTO } from './dto/get-customers.dto';
import { EditUserDTO } from './dto/edit-user.dto';
import { CustomersDashboardResponseDto, CustomerResponseDto, CustomerStatsResponseDto, UserDetailResponseDto } from './dto/customer-response.dto';
import { ApiResponse } from 'src/shared/helper-functions/response';
import { PermissionsService } from './permissions.service';
import { formatDate } from 'src/shared/helper-functions/formatter';

@Injectable()
export class CustomersService {
    private readonly logger = new Logger(CustomersService.name);
    constructor(
        private prisma: PrismaService,
        private permissionsService: PermissionsService
    ) {}

    async getCustomersDashboard(query: GetCustomersDto, userId: string): Promise<ApiResponse<CustomersDashboardResponseDto>> {
        this.logger.log('Fetching customers dashboard data...');

        try {
            const {
                page = 1,
                limit = 25,
                search,
                email,
                phone,
                status,
                startDate,
                endDate,
                minTotalValue,
                maxTotalValue,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = query;

            const skip = (page - 1) * limit;

            // Build where clause for customers
            const whereClause: any = {};

            if (search) {
                whereClause.OR = [
                    { email: { contains: search, mode: 'insensitive' } },
                    { first_name: { contains: search, mode: 'insensitive' } },
                    { last_name: { contains: search, mode: 'insensitive' } },
                    { phone_number: { contains: search, mode: 'insensitive' } }
                ];
            }

            if (email) {
                whereClause.email = { contains: email, mode: 'insensitive' };
            }

            if (phone) {
                whereClause.phone_number = { contains: phone, mode: 'insensitive' };
            }

            if (status) {
                whereClause.status = status;
            }

            if (startDate || endDate) {
                whereClause.createdAt = {};
                if (startDate) whereClause.createdAt.gte = new Date(startDate);
                if (endDate) whereClause.createdAt.lte = new Date(endDate);
            }

            // Get customers with their order statistics
            const customers = await this.prisma.user.findMany({
                skip,
                take: limit,
                where: whereClause,
                include: {
                    orders: {
                        select: {
                            id: true,
                            total_amount: true,
                            createdAt: true,
                            orderStatus: true
                        },
                        orderBy: { createdAt: 'desc' }
                    }
                },
                orderBy: { [sortBy]: sortOrder }
            });

            this.logger.log(`Customers fetched successfully. Found ${customers.length} customers`);

            // Map user level to allowed percentage (number)
            const levelToPercentage: Record<string, number> = {
                bronze: 25,
                silver: 50,
                gold: 75,
                platinum: 100,
                vip: 100
            };

            // Transform customers to include calculated fields
            const transformedCustomers = customers.map(customer => {
                // Calculate customer statistics
                const totalOrders = customer.orders.length;
                const totalValue = customer.orders.reduce((sum: number, order: any) => sum + order.total_amount, 0);
                
                // Calculate total owed (orders that are pending or confirmed)
                const totalOwed = customer.orders
                    .filter((order: any) => ['pending', 'confirmed'].includes(order.status))
                    .reduce((sum: number, order: any) => sum + order.total_amount, 0);

                // Get last order date
                const lastOrder = customer.orders[0];
                const lastOrderDate = lastOrder ? lastOrder.createdAt.toISOString().split('T')[0] : undefined;

                // Map user status
                const statusMap = {
                    'active': 'Active',
                    'suspended': 'Suspended',
                    'inactive': 'Inactive'
                };

                // Use the user's level from the DB
                const level = customer.level || 'bronze';
                const paymentPercentage = levelToPercentage[level] ?? 0;

                const allowedPercentage = customer && customer.level ? levelToPercentage[customer.level] : null;

                return {
                    id: customer.id,
                    name: `${customer.first_name} ${customer.last_name}`,
                    email: customer.email,
                    phone: customer.phone_number || "",
                    address: customer.address || 'N/A',
                    joinDate: customer.createdAt.toISOString().split('T')[0],
                    totalOrders,
                    totalValue: Math.round(totalValue),
                    totalOwed: Math.round(totalOwed),
                    level,
                    paymentPercentage,
                    allowedPercentage: allowedPercentage,
                    lastOrderDate,
                    status: statusMap[customer.status] || customer.status
                };
            });

            // Apply value filters after transformation
            let filteredCustomers = transformedCustomers;
            if (minTotalValue || maxTotalValue) {
                filteredCustomers = transformedCustomers.filter(customer => {
                    if (minTotalValue && customer.totalValue < minTotalValue) return false;
                    if (maxTotalValue && customer.totalValue > maxTotalValue) return false;
                    return true;
                });
            }

            // Get stats
            const [
                totalAdmins,
                totalCustomers,
                activeCustomers,
                totalOrders,
                totalValue,
                totalOwed
            ] = await Promise.all([
                this.prisma.user.count({where: { role: "admin" }}),
                this.prisma.user.count(),
                this.prisma.user.count({ where: {status: 'active' } }),
                this.prisma.order.count(),
                this.prisma.order.aggregate({
                    _sum: { total_amount: true }
                }),
                this.prisma.order.aggregate({
                    where: { orderStatus: { in: ['pending', 'confirmed'] } },
                    _sum: { total_amount: true }
                })
            ]);

            const stats = {
                totalAdmins,
                totalCustomers,
                activeCustomers,
                totalOrders,
                totalValue: Math.round(totalValue._sum.total_amount || 0),
                totalOwed: Math.round(totalOwed._sum.total_amount || 0)
            };

            // Fetch the authenticated user's level
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { level: true }
            });
            

            this.logger.log(`Customers dashboard data retrieved successfully. Found ${filteredCustomers.length} customers`);

            const formatted_response = {
                stats,
                customers: filteredCustomers,
            };

            return new ApiResponse(
                true,
                "Customers dashboard data retrieved successfully",
                formatted_response
            );

        } catch (error) {
            this.logger.error('Error fetching customers dashboard:', error);
            throw error;
        }
    }

    // Service and controller to get  user by ID
    async getUserById(id: string): Promise<ApiResponse<UserDetailResponseDto>> {
        this.logger.log(`Fetching user details for ID: ${id}`);

        try {
            // Validate ID format
            if (!id || typeof id !== 'string') {
                throw new BadRequestException('Invalid user ID provided');
            }

            // Find user with orders
            const user = await this.prisma.user.findUnique({
                where: { id },
                include: {
                    orders: {
                        select: {
                            id: true,
                            orderId: true,
                            total_amount: true,
                            orderStatus: true,
                            orderPaymentStatus: true,
                            shipmentStatus: true,
                            createdAt: true,
                            updatedAt: true
                        },
                        orderBy: { createdAt: 'desc' }
                    }
                }
            });

            if (!user) {
                throw new NotFoundException(`User with ID ${id} not found`);
            }

            // Calculate user statistics
            const totalOrders = user.orders.length;
            const totalValue = user.orders.reduce((sum, order) => sum + order.total_amount, 0);
            const totalOwed = user.orders
                .filter(order => ['pending', 'confirmed'].includes(order.orderStatus || ''))
                .reduce((sum, order) => sum + order.total_amount, 0);

            // Get last order date
            const lastOrder = user.orders[0];
            const lastOrderDate = lastOrder ? lastOrder.createdAt.toISOString().split('T')[0] : undefined;

            // Transform user data
            const userDetail: UserDetailResponseDto = {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                phone_number: user.phone_number || undefined,
                address: user.address || undefined,
                level: user.level || undefined,
                status: user.status,
                role: user.role,
                permissions: user.permissions || [],
                createdAt: user.createdAt.toISOString(),
                updatedAt: user.updatedAt.toISOString(),
                totalOrders,
                totalValue: Math.round(totalValue),
                totalOwed: Math.round(totalOwed),
                lastOrderDate,
                orders: user.orders.map(order => ({
                    id: order.id,
                    orderId: order.orderId || '',
                    total_amount: order.total_amount,
                    orderStatus: order.orderStatus || '',
                    orderPaymentStatus: order.orderPaymentStatus || '',
                    shipmentStatus: order.shipmentStatus || '',
                    createdAt: order.createdAt.toISOString(),
                    updatedAt: order.updatedAt.toISOString()
                }))
            };

            this.logger.log(`User details retrieved successfully for ID: ${id}`);

            return new ApiResponse(
                true,
                "User details retrieved successfully",
                userDetail
            );

        } catch (error) {
            this.logger.error(`Error fetching user by ID ${id}:`, error);
            
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            
            throw new BadRequestException('Failed to retrieve user details');
        }
    }

    // now the one to get a user for edit
    async getAUserForEdit(dto: GetUserForEditDTO) {
        this.logger.log(`Fetching user details for ID: ${dto.id}`);

        try {
            // Validate ID format
            if (!dto.id || typeof dto.id !== 'string') {
                throw new BadRequestException('Invalid user ID provided');
            }

            const user = await this.prisma.user.findUnique({
                where: { id: dto.id },
            });

            if (!user) {
                this.logger.error(`User with ID ${dto.id} not found`);
                throw new NotFoundException(`User with ID ${dto.id} not found`);
            }

            const formattedUserForEdit = {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,  
                phone_number: user.phone_number,
                address: user.address,
                level: user.level,
                minimum_allowed_percentage: user.allowedPartialPayment,
                status: user.status,
                role: user.role,
                permissions: user.permissions || [],
                createdAt: formatDate(user.createdAt),
                updatedAt: formatDate(user.updatedAt),
            };
            
            // Available options for form fields
            const availableOptions = {
                status: ['active', 'suspended', 'inactive'],
                role: ['super_admin', 'admin', 'inventory_manager', 'shipment_manager', 'marketer', 'user'],
                level: ['bronze', 'silver', 'gold', 'platinum', 'vip'],
                // permissions: this.permissionsService.getAllPermissions(),
                categorizedPermissions: this.permissionsService.getCategorizedPermissions(),
                gender: ['male', 'female', 'other']
            };

            const formatted_response = {
                availableOptions,
                user: formattedUserForEdit,
            };

            this.logger.log(`User details retrieved successfully for edit - ID: ${dto.id}`);

            return new ApiResponse(
                true,
                "User details retrieved successfully",
                formatted_response
            );
            
        } catch (error) {
            this.logger.error(`Error fetching user for edit with ID ${dto.id}:`, error);
            
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            
            throw new BadRequestException('Failed to retrieve user details for edit');
        }
    }

    // Edit user
    async editUser(id: string, dto: EditUserDTO): Promise<ApiResponse<any>> {
        this.logger.log(`Editing user with ID: ${id}`);

        try {
            // Validate ID format
            if (!id || typeof id !== 'string') {
                throw new BadRequestException('Invalid user ID provided');
            }

            // Check if user exists
            const existingUser = await this.prisma.user.findUnique({
                where: { id: id },
                select: { 
                    id: true, 
                    permissions: true,
                    email: true,
                    first_name: true,
                    last_name: true
                }
            });

            if (!existingUser) {
                throw new NotFoundException(`User with ID ${id} not found`);
            }

            // Prepare update data - only include fields that are provided
            const updateData: any = {};

            // Basic fields
            if (dto.first_name !== undefined) updateData.first_name = dto.first_name;
            if (dto.last_name !== undefined) updateData.last_name = dto.last_name;
            if (dto.email !== undefined) updateData.email = dto.email;
            if (dto.phone_number !== undefined) updateData.phone_number = dto.phone_number;
            if (dto.address !== undefined) updateData.address = dto.address;
            if (dto.level !== undefined) updateData.level = dto.level;
            if (dto.allowedPartialPayment !== undefined) updateData.allowedPartialPayment = dto.allowedPartialPayment;
            if (dto.status !== undefined) updateData.status = dto.status;
            if (dto.role !== undefined) updateData.role = dto.role;
            if (dto.gender !== undefined) updateData.gender = dto.gender;
            if (dto.is_active !== undefined) updateData.is_active = dto.is_active;
            if (dto.display_picture !== undefined) updateData.display_picture = dto.display_picture;

            // Handle permissions - replace with what's sent from frontend
            if (dto.permissions !== undefined) {
                const currentPermissions = existingUser.permissions || [];
                const newPermissions = dto.permissions;
                
                // Replace permissions with what's sent from frontend
                updateData.permissions = newPermissions;
                
                // Log what permissions were added/removed
                const addedPermissions = newPermissions.filter(p => !currentPermissions.includes(p));
                const removedPermissions = currentPermissions.filter(p => !newPermissions.includes(p));
                
                if (addedPermissions.length > 0) {
                    this.logger.log(`Added permissions: ${addedPermissions.join(', ')} to user ${id}`);
                }
                
                if (removedPermissions.length > 0) {
                    this.logger.log(`Removed permissions: ${removedPermissions.join(', ')} from user ${id}`);
                }
                
                this.logger.log(`Updated permissions for user ${id}: ${newPermissions.length} total permissions`);
            }

            // Update the user
            const updatedUser = await this.prisma.user.update({
                where: { id: id },
                data: updateData,
                select: {
                    id: true,
                    first_name: true,
                    last_name: true,
                    email: true,
                    phone_number: true,
                    address: true,
                    level: true,
                    allowedPartialPayment: true,
                    status: true,
                    role: true,
                    permissions: true,
                    gender: true,
                    is_active: true,
                    display_picture: true,
                    createdAt: true,
                    updatedAt: true
                }
            });

            this.logger.log(`User ${id} updated successfully`);

            // Calculate permission changes for response
            let permissionChanges = {};
            if (dto.permissions !== undefined) {
                const currentPermissions = existingUser.permissions || [];
                const newPermissions = dto.permissions;
                const addedPermissions = newPermissions.filter(p => !currentPermissions.includes(p));
                const removedPermissions = currentPermissions.filter(p => !newPermissions.includes(p));
                
                permissionChanges = {
                    permissionsAdded: addedPermissions,
                    permissionsRemoved: removedPermissions,
                    totalPermissions: newPermissions.length
                };
            }

            return new ApiResponse(
                true,
                "User updated successfully",
                {
                    user: {
                        ...updatedUser,
                        createdAt: formatDate(updatedUser.createdAt),
                        updatedAt: formatDate(updatedUser.updatedAt)
                    },
                    updatedFields: Object.keys(updateData),
                    ...permissionChanges
                }
            );

        } catch (error) {
            this.logger.error(`Error editing user with ID ${id}:`, error);
            
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            
            throw new BadRequestException('Failed to update user');
        }
    }
} 