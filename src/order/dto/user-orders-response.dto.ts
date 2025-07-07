import { OrderStatus } from '@prisma/client';

export interface UserOrderItemDto {
    id: string;
    productId: string;
    productName: string;
    productIsbn?: string | null;
    productPublisher?: string | null;
    quantity: number;
    price: number;
    createdAt: Date;
}

export interface UserOrderDto {
    id: string;
    // orderId: string;
    status: OrderStatus;
    total: number;
    shippingAddress: string;
    state?: string | null;
    city?: string | null;
    houseAddress?: string | null;
    orderPaymentStatus: string;
    trackingNumber?: string | null;
    withdrawalStatus: string;
    createdAt: Date;
    updatedAt: Date;
    items: UserOrderItemDto[];
}

export interface UserOrdersPaginationDto {
    currentPage: number;
    totalPages: number;
    perPage: number;
    totalItems: number;
}

export interface UserOrdersResponseDto {
    pagination: UserOrdersPaginationDto;
    orders: UserOrderDto[];
} 