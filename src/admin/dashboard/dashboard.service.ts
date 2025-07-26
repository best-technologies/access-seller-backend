import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { formatAmount, formatDateWithoutTime } from 'src/shared/helper-functions/formatter';
import { ApiResponse } from 'src/shared/helper-functions/response';

@Injectable()
export class DashboardService {
    private readonly logger = new Logger(DashboardService.name);
    constructor(private prisma: PrismaService) {}

    async getDashboardStats() {
        this.logger.log('Fetching comprehensive dashboard statistics...');
        try {
            const now = new Date();

            // Revenue stats
            const [
                totalRevenueAgg,
                juneRevenueAgg,
                mayRevenueAgg
            ] = await Promise.all([
                this.prisma.order.aggregate({
                    _sum: { total_amount: true },
                    where: { orderPaymentStatus: 'completed' }
                }),
                this.prisma.order.aggregate({
                    _sum: { total_amount: true },
                    where: {
                        orderPaymentStatus: 'completed',
                        createdAt: { gte: new Date(now.getFullYear(), 5, 1), lte: new Date(now.getFullYear(), 5, 30, 23, 59, 59, 999) }
                    }
                }),
                this.prisma.order.aggregate({
                    _sum: { total_amount: true },
                    where: {
                        orderPaymentStatus: 'completed',
                        createdAt: { gte: new Date(now.getFullYear(), 4, 1), lte: new Date(now.getFullYear(), 4, 31, 23, 59, 59, 999) }
                    }
                })
            ]);

            // Order counts by shipping status
            const shipmentStatuses = ['awaiting_payment', 'processing', 'in_transit', 'awaiting_verification'];
            const orderCountsByShippingStatus: Record<string, number> = {};
            await Promise.all(shipmentStatuses.map(async status => {
                orderCountsByShippingStatus[status] = await this.prisma.order.count({ where: { shipmentStatus: status as any } });
            }));

            const revenueCard = {
                allTimeRevenue: Math.round(totalRevenueAgg._sum.total_amount || 0),
                juneRevenue: Math.round(juneRevenueAgg._sum.total_amount || 0),
                mayRevenue: Math.round(mayRevenueAgg._sum.total_amount || 0),
                orderCountsByShippingStatus
            };

            // Order stats
            const [
                totalOrders,
                juneOrders,
                mayOrders
            ] = await Promise.all([
                this.prisma.order.count({ where: { orderPaymentStatus: 'completed' } }),
                this.prisma.order.count({
                    where: {
                        orderPaymentStatus: 'completed',
                        createdAt: { gte: new Date(now.getFullYear(), 5, 1), lte: new Date(now.getFullYear(), 5, 30, 23, 59, 59, 999) }
                    }
                }),
                this.prisma.order.count({
                    where: {
                        orderPaymentStatus: 'completed',
                        createdAt: { gte: new Date(now.getFullYear(), 4, 1), lte: new Date(now.getFullYear(), 4, 31, 23, 59, 59, 999) }
                    }
                })
            ]);
            const orderCard = {
                allTimeOrders: totalOrders,
                juneTotalOrders: juneOrders,
                mayTotalOrders: mayOrders
            };

            // Customer stats
            const [
                adminCount,
                totalCustomers,
                activeCustomers,
                affiliateCount
            ] = await Promise.all([
                this.prisma.user.count({ where: { role: 'admin' } }),
                this.prisma.user.count({ where: { role: 'user' } }),
                this.prisma.user.count({ where: { role: 'user', is_active: true } }),
                this.prisma.affiliate.count({})
            ]);
            const customerCard = {
                admins: adminCount,
                totalCustomers,
                activeCustomers,
                affiliates: affiliateCount
            };

            // Product stats
            const [
                totalProducts,
                activeProducts
            ] = await Promise.all([
                this.prisma.product.count({}),
                this.prisma.product.count({ where: { isActive: true } })
            ]);
            const productCard = {
                totalProducts,
                activeProducts
            };

            // Build stats object
            const stats = {
                revenueCard,
                orderCard,
                customerCard,
                productCard
            };

            // Recent orders (5 most recent)
            const recentOrdersRaw = await this.prisma.order.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            email: true,
                            phone_number: true
                        }
                    },
                    items: {
                        select: { quantity: true }
                    }
                }
            });
            const recentOrders = await Promise.all(recentOrdersRaw.map(async order => {
                let referredBy = { name: '', email: '', phone: '' };
                if (order.referralSlug) {
                    const affiliateLink = await this.prisma.affiliateLink.findUnique({
                        where: { slug: order.referralSlug },
                        include: { user: { select: { first_name: true, last_name: true, email: true, phone_number: true } } }
                    });
                    if (affiliateLink && affiliateLink.user) {
                        referredBy = {
                            name: `${affiliateLink.user.first_name || ''} ${affiliateLink.user.last_name || ''}`.trim(),
                            email: affiliateLink.user.email || '',
                            phone: affiliateLink.user.phone_number || ''
                        };
                    }
                }
                return {
                    id: order.id,
                    orderId: order.orderId || order.id,
                    customerName: `${order.user?.first_name || ''} ${order.user?.last_name || ''}`.trim(),
                    customerEmail: order.user?.email || '',
                    customerPhone: order.user?.phone_number || '',
                    orderAmount: formatAmount(Math.round(order.total_amount)),
                    paymentStatus: order.orderPaymentStatus || '',
                    orderShippingStatus: order.shipmentStatus || '',
                    date: formatDateWithoutTime(order.createdAt),
                    totalItems: order.items.reduce((sum, item) => sum + item.quantity, 0),
                    referredBy
                };
            }));

            // Notifications (latest 5)
            const notificationsRaw = await this.prisma.notification.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' }
            });
            const notificationTypes = ['order', 'system', 'user', 'affiliate', 'withdrawal'];
            const priorities = ['low', 'medium', 'high'];
            const notifications = notificationsRaw.map((notification, idx) => ({
                id: notification.id,
                type: notificationTypes[idx % notificationTypes.length],
                title: notification.title,
                message: notification.description,
                time: this.getTimeAgo(notification.createdAt),
                read: false, // You can update this logic if you have a read status
                priority: priorities[idx % priorities.length]
            }));

            // Top 5 selling products
            const topSelling = await this.prisma.orderItem.groupBy({
                by: ['productId'],
                _sum: { quantity: true },
                orderBy: { _sum: { quantity: 'desc' } },
                take: 5,
            });
            const productIds = topSelling.map(item => item.productId);
            let topProducts: any[] = [];
            if (productIds.length > 0) {
                const products = await this.prisma.product.findMany({
                    where: { id: { in: productIds } },
                    select: { id: true, name: true, displayImages: true, sellingPrice: true }
                });
                topProducts = products.map(product => {
                    let image = '';
                    if (product.displayImages) {
                        let images = product.displayImages;
                        if (typeof images === 'string') {
                            try { images = JSON.parse(images); } catch { images = []; }
                        }
                        if (Array.isArray(images) && images.length > 0) {
                            const firstImg = images[0];
                            if (typeof firstImg === 'string') image = firstImg;
                            else if (firstImg && typeof firstImg === 'object') {
                                if ('secure_url' in firstImg && typeof firstImg.secure_url === 'string') image = firstImg.secure_url;
                                else if ('secureUrl' in firstImg && typeof firstImg.secureUrl === 'string') image = firstImg.secureUrl;
                                else if ('url' in firstImg && typeof firstImg.url === 'string') image = firstImg.url;
                            }
                        }
                    }
                    const sales = topSelling.find(item => item.productId === product.id)?._sum.quantity || 0;
                    return {
                        id: product.id,
                        name: product.name,
                        image,
                        price: product.sellingPrice,
                        sales
                    };
                });
                topProducts.sort((a, b) => b.sales - a.sales);
            }

            const dashboardData = {
                stats,
                recentOrders,
                notifications,
                topSellingProducts: topProducts
            };

            this.logger.log('Dashboard statistics retrieved successfully');
            return new ApiResponse(
                true,
                "Dashboard statistics retrieved successfully",
                dashboardData
            );
        } catch (error) {
            this.logger.error('Error fetching dashboard statistics:', error);
            throw error;
        }
    }

    private getTimeAgo(date: Date): string {
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
        
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours} hours ago`;
        
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays} days ago`;
    }

    async getRevenueAnalytics(period: 'daily' | 'weekly' | 'monthly' = 'monthly') {
        this.logger.log(`Fetching revenue analytics for period: ${period}`);

        try {
            const now = new Date();
            let startDate: Date;

            switch (period) {
                case 'daily':
                    startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                    break;
                case 'weekly':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'monthly':
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            }

            const revenueData = await this.prisma.order.groupBy({
                by: ['createdAt'],
                _sum: {
                    total: true
                },
                where: {
                    orderStatus: 'delivered',
                    createdAt: {
                        gte: startDate
                    }
                },
                orderBy: {
                    createdAt: 'asc'
                }
            });

            this.logger.log('Revenue analytics retrieved successfully');
            return revenueData;

        } catch (error) {
            this.logger.error('Error fetching revenue analytics:', error);
            throw error;
        }
    }

    async getTopPerformingStores(limit: number = 10) {
        this.logger.log(`Fetching top performing stores (limit: ${limit})`);

        try {
            const topStores = await this.prisma.store.findMany({
                take: limit,
                include: {
                    _count: {
                        select: {
                            products: true,
                            orders: true
                        }
                    },
                    orders: {
                        where: {
                            orderStatus: 'delivered'
                        },
                        select: {
                            total_amount: true
                        }
                    }
                },
                orderBy: {
                    orders: {
                        _count: 'desc'
                    }
                }
            });

            // Calculate total revenue for each store
            const storesWithRevenue = topStores.map(store => ({
                ...store,
                totalRevenue: store.orders.reduce((sum, order) => sum + order.total_amount, 0)
            }));

            this.logger.log('Top performing stores retrieved successfully');
            return storesWithRevenue;

        } catch (error) {
            this.logger.error('Error fetching top performing stores:', error);
            throw error;
        }
    }
} 