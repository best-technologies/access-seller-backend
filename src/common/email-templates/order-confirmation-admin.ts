export const orderConfirmationAdminTemplate = (payload: {
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
  commissionAmount?: string;
  affiliateUserId?: string;
}): string => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9fafb; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
        <!-- Header -->
        <div style="padding: 30px; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 600;">🛒 New Order Received!</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 16px;">Payment confirmed and order ready for processing</p>
        </div>

        <!-- Main Content -->
        <div style="padding: 30px;">
          <!-- Alert -->
          <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
              <div style="width: 24px; height: 24px; background-color: #dc2626; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 14px;">!</span>
              </div>
              <h3 style="margin: 0; color: #991b1b; font-size: 18px;">Action Required</h3>
            </div>
            <p style="margin: 0; color: #b91c1c; font-size: 14px;">
              A new order has been placed and payment has been confirmed. Please process this order as soon as possible.
            </p>
          </div>

          <!-- Order Summary -->
          <div style="background-color: #f8fafc; border-radius: 8px; padding: 24px; margin-bottom: 30px;">
            <h3 style="margin: 0 0 20px 0; color: #1f2937; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">
              📋 Order Summary
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
                <p style="margin: 0; color: #059669; font-weight: 600; font-size: 18px;">₦${payload.orderTotal}</p>
              </div>
              <div>
                <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">Payment Status</p>
                <p style="margin: 0; color: #10b981; font-weight: 600; font-size: 16px;">${payload.paymentStatus}</p>
              </div>
            </div>

            ${payload.trackingNumber ? `
            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 12px; margin-top: 16px;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>Affiliate Tracking:</strong> ${payload.trackingNumber}
              </p>
            </div>
            ` : ''}
          </div>

          <!-- Customer Information -->
          <div style="background-color: #f8fafc; border-radius: 8px; padding: 24px; margin-bottom: 30px;">
            <h3 style="margin: 0 0 20px 0; color: #1f2937; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">
              👤 Customer Information
            </h3>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
              <div>
                <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">Customer Name</p>
                <p style="margin: 0; color: #1f2937; font-weight: 600; font-size: 16px;">${payload.firstName} ${payload.lastName}</p>
              </div>
              <div>
                <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">Email Address</p>
                <p style="margin: 0; color: #1f2937; font-weight: 600; font-size: 16px;">${payload.email}</p>
              </div>
            </div>

            <div style="margin-bottom: 16px;">
              <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">Delivery Address</p>
              <p style="margin: 0; color: #1f2937; font-size: 16px; line-height: 1.5;">
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

          <!-- Affiliate Information -->
          ${payload.commissionAmount && payload.affiliateUserId ? `
          <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 24px; margin-bottom: 30px;">
            <h3 style="margin: 0 0 20px 0; color: #0c4a6e; font-size: 18px; border-bottom: 2px solid #0ea5e9; padding-bottom: 8px;">
              💰 Affiliate Commission
            </h3>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div>
                <p style="margin: 0 0 4px 0; color: #0369a1; font-size: 14px;">Affiliate User ID</p>
                <p style="margin: 0; color: #0c4a6e; font-weight: 600; font-size: 16px;">${payload.affiliateUserId}</p>
              </div>
              <div>
                <p style="margin: 0 0 4px 0; color: #0369a1; font-size: 14px;">Commission Amount</p>
                <p style="margin: 0; color: #059669; font-weight: 600; font-size: 18px;">₦${payload.commissionAmount}</p>
              </div>
            </div>
          </div>
          ` : ''}

          <!-- Action Required -->
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
            <h3 style="margin: 0 0 12px 0; color: #92400e; font-size: 18px;">🚀 Next Steps</h3>
            <ul style="margin: 0; padding-left: 20px; color: #a16207;">
              <li style="margin-bottom: 8px;">Review order details and customer information</li>
              <li style="margin-bottom: 8px;">Prepare items for shipping</li>
              <li style="margin-bottom: 8px;">Update order status in the admin panel</li>
              <li style="margin-bottom: 8px;">Send shipping confirmation to customer</li>
              <li style="margin-bottom: 0;">Process affiliate commission if applicable</li>
            </ul>
          </div>

          <!-- Quick Actions -->
          <div style="text-align: center; padding: 20px; background-color: #f8fafc; border-radius: 8px;">
            <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px;">Quick Actions</p>
            <div style="display: flex; gap: 12px; justify-content: center;">
              <a href="#" style="background-color: #4f46e5; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500;">View Order Details</a>
              <a href="#" style="background-color: #10b981; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500;">Update Status</a>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="padding: 20px; background-color: #f3f4f6; text-align: center; font-size: 12px; color: #6b7280;">
          <p style="margin: 0 0 8px 0;">Acces-Sellr Admin Notification</p>
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} Acces-Sellr. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;
}; 