export class CustomerResponseDto {
    id: string;
    name: string;
    email: string;
    phone: string;
    address?: string;
    joinDate: string;
    totalOrders: number;
    totalValue: number;
    totalOwed: number;
    level: string;
    paymentPercentage: number;
    lastOrderDate?: string;
    status: string;
}

export class UserDetailResponseDto {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number?: string;
    address?: string;
    level?: string;
    status: string;
    role: string;
    permissions: string[];
    createdAt: string;
    updatedAt: string;
    totalOrders: number;
    totalValue: number;
    totalOwed: number;
    lastOrderDate?: string;
    orders: Array<{
        id: string;
        orderId: string;
        total_amount: number;
        orderStatus: string;
        orderPaymentStatus: string;
        shipmentStatus: string;
        createdAt: string;
        updatedAt: string;
    }>;
}

export class CustomerStatsResponseDto {
    totalCustomers: number;
    activeCustomers: number;
    totalOrders: number;
    totalValue: number;
    totalOwed: number;
}

export class CustomersDashboardResponseDto {
    customers: CustomerResponseDto[];
    stats: CustomerStatsResponseDto;
} 