export interface ReferralUsedTemplateProps {
  affiliateName: string;
  affiliateEmail: string;
  orderId: string;
  productName: string;
  productImageUrl?: string;
  buyerName: string;
  buyerEmail: string;
  purchaseAmount: number;
  purchaseDate: string;
  channel: string; // 'referral code' or 'affiliate link'
}

export function referralUsedTemplate(props: ReferralUsedTemplateProps): string {
  return `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f7f7f9; padding: 32px; color: #222;">
    <div style="max-width: 700px; margin: 0 auto; background: #fff; border-radius: 14px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); padding: 40px 32px;">
      <h2 style="color: #1a73e8; margin-bottom: 8px;">Good news, ${props.affiliateName}!</h2>
      <p style="font-size: 1.1em; margin-bottom: 28px;">Your <b>${props.channel}</b> was just used for a purchase. A commission is now pending approval for you.</p>
      ${props.productImageUrl ? `<div style="text-align:center; margin-bottom: 24px;"><img src="${props.productImageUrl}" alt="Product Image" style="max-width:180px; max-height:180px; border-radius:10px; box-shadow:0 1px 6px rgba(0,0,0,0.08);" /></div>` : ''}
      <div style="background: #f1f3f4; border-radius: 10px; padding: 24px 20px; margin-bottom: 32px;">
        <h3 style="margin-bottom: 16px; color: #222;">Purchase Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tbody>
            <tr>
              <td style="padding: 8px 0; font-weight: 500; width: 160px;">Order ID:</td>
              <td style="padding: 8px 0;">${props.orderId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 500;">Product:</td>
              <td style="padding: 8px 0;">${props.productName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 500;">Buyer:</td>
              <td style="padding: 8px 0;">${props.buyerName} (${props.buyerEmail})</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 500;">Purchase Amount:</td>
              <td style="padding: 8px 0; color: #1a73e8; font-weight: bold; font-size: 1.1em;">₦${props.purchaseAmount.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 500;">Date:</td>
              <td style="padding: 8px 0;">${props.purchaseDate}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p style="margin-bottom: 24px;">Your commission for this purchase is now <b>pending approval</b>. You will receive another email once it is approved and credited to your wallet.</p>
      <div style="font-size: 0.95em; color: #888; margin-top: 32px;">
        <p>If you have any questions or need support, please contact us at <a href="mailto:support@acces-sellr.com" style="color: #1a73e8;">support@acces-sellr.com</a>.</p>
        <p style="margin-top: 16px;">Best regards,<br><b>Acces-Sellr Team</b></p>
      </div>
    </div>
  </div>
  `;
} 