export const orderConfirmationBuyerTemplate = (payload: {
  orderId: string;
  firstName: string;
  lastName: string;
  email: string;
  orderTotal: string;
  state: string;
  city: string;
  houseAddress: string;
  trackingNumber?: string;
  paymentStatus: string;
  shippingAddress: string;
  orderCreated: string;
  updatedAt: string;
  productName?: string;
  quantity?: number;
}): string => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9fafb; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
        <!-- Header -->
        <div style="padding: 30px; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 600;">🎉 Order Confirmed!</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 16px;">Thank you for your purchase</p>
        </div>

        <!-- Main Content -->
        <div style="padding: 30px;">
          <!-- Greeting -->
          <div style="margin-bottom: 30px;">
            <h2 style="color: #1f2937; margin: 0 0 8px 0; font-size: 20px;">Hello ${payload.firstName} ${payload.lastName},</h2>
            <p style="color: #6b7280; margin: 0; line-height: 1.6;">
              Your order has been successfully confirmed and payment has been received. We're excited to process your order!
            </p>
          </div>

          <!-- Order Status -->
          <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
              <div style="width: 24px; height: 24px; background-color: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 14px;">✓</span>
              </div>
              <h3 style="margin: 0; color: #0c4a6e; font-size: 18px;">Payment Confirmed</h3>
            </div>
            <p style="margin: 0; color: #0369a1; font-size: 14px;">
              Your payment of <strong>₦${payload.orderTotal}</strong> has been successfully processed.
            </p>
          </div>

          <!-- Order Details -->
          <div style="background-color: #f8fafc; border-radius: 8px; padding: 24px; margin-bottom: 30px;">
            <h3 style="margin: 0 0 20px 0; color: #1f2937; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">
              Order Details
            </h3>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
              <div>
                <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">Order ID</p>
                <p style="margin: 0; color: #1f2937; font-weight: 600; font-size: 16px;">${payload.orderId}</p>
              </div>
              <div>
                <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">Order Date</p>
                <p style="margin: 0; color: #1f2937; font-weight: 600; font-size: 16px;">${payload.orderCreated}</p>
              </div>
              <div>
                <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">Total Amount</p>
                <p style="margin: 0; color: #1f2937; font-weight: 600; font-size: 16px;">₦${payload.orderTotal}</p>
              </div>
              <div>
                <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">Payment Status</p>
                <p style="margin: 0; color: #10b981; font-weight: 600; font-size: 16px;">${payload.paymentStatus}</p>
              </div>
            </div>

            ${payload.trackingNumber ? `
            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 12px; margin-top: 16px;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>Tracking Number:</strong> ${payload.trackingNumber}
              </p>
            </div>
            ` : ''}
          </div>

          <!-- Shipping Information -->
          <div style="background-color: #f8fafc; border-radius: 8px; padding: 24px; margin-bottom: 30px;">
            <h3 style="margin: 0 0 20px 0; color: #1f2937; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">
              📍 Shipping Information
            </h3>
            
            <div style="margin-bottom: 16px;">
              <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">Delivery Address</p>
              <p style="margin: 0; color: #1f2937; font-weight: 600; font-size: 16px; line-height: 1.5;">
                ${payload.firstName} ${payload.lastName}<br>
                ${payload.houseAddress}<br>
                ${payload.city}, ${payload.state}<br>
                Nigeria
              </p>
            </div>

            <div>
              <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">Full Shipping Address</p>
              <p style="margin: 0; color: #1f2937; font-size: 16px; line-height: 1.5;">
                ${payload.shippingAddress}
              </p>
            </div>
          </div>

          <!-- Next Steps -->
          <div style="background-color: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
            <h3 style="margin: 0 0 12px 0; color: #065f46; font-size: 18px;">What's Next?</h3>
            <ul style="margin: 0; padding-left: 20px; color: #047857;">
              <li style="margin-bottom: 8px;">We'll process your order within 24-48 hours</li>
              <li style="margin-bottom: 8px;">You'll receive shipping updates via email</li>
              <li style="margin-bottom: 8px;">Delivery typically takes 3-7 business days</li>
              <li style="margin-bottom: 0;">Track your order using the tracking number above</li>
            </ul>
          </div>

          <!-- Contact Information -->
          <div style="text-align: center; padding: 20px; background-color: #f8fafc; border-radius: 8px;">
            <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px;">Need help? Contact our support team</p>
            <p style="margin: 0; color: #4f46e5; font-weight: 600; font-size: 16px;">support@acces-sellr.com</p>
          </div>
        </div>

        <!-- Footer -->
        <div style="padding: 20px; background-color: #f3f4f6; text-align: center; font-size: 12px; color: #6b7280;">
          <p style="margin: 0 0 8px 0;">Thank you for choosing Acces-Sellr!</p>
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} Acces-Sellr. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;
}; 