export interface PromoCodeVerifyResponse {
    success: boolean;
    message: string;
    data: {
        id: string;
        code: string;
        description: string;
        discountPercent: string;
        createdByEmail: string;
        createdByName: string;
        productId: string;
        createdAt: string;
    }
}