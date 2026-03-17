import * as colors from "colors"
import { Logger } from '@nestjs/common';
import * as nodemailer from "nodemailer";
import { onboardingMailTemplate } from "../email-templates/onboard-mail";
import { ResponseHelper } from "src/shared/helper-functions/response.helpers";
import { onboardingSchoolAdminNotificationTemplate } from "../email-templates/onboard-mail-admin";
import { passwordResetTemplate } from "../email-templates/password-reset-template";
import { loginOtpTemplate } from "../email-templates/login-otp-template";
import { orderConfirmationBuyerTemplate } from "../email-templates/order-confirmation-buyer";
import { orderConfirmationAdminTemplate } from "../email-templates/order-confirmation-admin";
import { commissionApprovedTemplate, CommissionApprovedTemplateProps } from '../email-templates/commission-approved-template';
import { referralUsedTemplate, ReferralUsedTemplateProps } from '../email-templates/referral-used-template';
import { commissionApprovalReportTemplate, CommissionApprovalReportProps } from '../email-templates/commission-approval-report-template';
import { cronErrorTemplate, CronErrorTemplateProps } from '../email-templates/cron-error-template';
import axios from 'axios';

const logger = new Logger('SendMail');

type EmailProvider = 'gmail' | 'resend';

interface CoreEmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  fromName?: string;
}

let gmailTransporter: nodemailer.Transporter | null = null;

function getEmailProvider(): EmailProvider {
  const raw = (process.env.EMAIL_PROVIDER || 'gmail').toLowerCase();
  if (raw === 'resend') return 'resend';
  return 'gmail';
}

async function getGmailTransporter(): Promise<nodemailer.Transporter> {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    throw new Error('SMTP credentials missing in environment variables');
  }

  if (gmailTransporter) {
    return gmailTransporter;
  }

  gmailTransporter = nodemailer.createTransport({
    service: 'gmail',
    host: process.env.GOOGLE_SMTP_HOST,
    port: process.env.GOOGLE_SMTP_PORT ? parseInt(process.env.GOOGLE_SMTP_PORT, 10) : 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  return gmailTransporter;
}

async function sendEmailCore(payload: CoreEmailPayload): Promise<void> {
  const provider = getEmailProvider();
  const fromAddress = process.env.EMAIL_USER as string;
  const fromName = payload.fromName || 'Acces-Sellr';

  if (!fromAddress) {
    throw new Error('EMAIL_USER is required as from address');
  }

  switch (provider) {
    case 'gmail': {
      const transporter = await getGmailTransporter();
      await transporter.sendMail({
        from: {
          name: fromName,
          address: fromAddress,
        },
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      });
      return;
    }
    case 'resend': {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        logger.warn('RESEND_API_KEY not set; falling back to Gmail provider');
        const transporter = await getGmailTransporter();
        await transporter.sendMail({
          from: {
            name: fromName,
            address: fromAddress,
          },
          to: payload.to,
          subject: payload.subject,
          html: payload.html,
        });
        return;
      }

      const toArray = Array.isArray(payload.to) ? payload.to : [payload.to];

      await axios.post(
        'https://api.resend.com/emails',
        {
          from: `${fromName} <${fromAddress}>`,
          to: toArray,
          subject: payload.subject,
          html: payload.html,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return;
    }
    default:
      throw new Error(`Unsupported email provider: ${provider}`);
  }
}

// add the interface for the mail to send 
export interface OnboardingMailPayload {
    school_name: string;
    school_email: string;
    school_phone: string;
    school_address: string;
    school_type: string;
    school_ownership: string;
    documents: {
        cac?: string | null;
        utility_bill?: string | null;
        tax_clearance?: string | null;
    };
}

interface OnboardingAdminPayload {
    school_name: string;
    school_email: string;
    school_phone: string;
    school_address: string;
    school_type: string;
    school_ownership: string;
    documents: {
      cac: string | null;
      utility_bill: string | null;
      tax_clearance: string | null;
    };
    defaultPassword: string | null;
}

interface SendResetOtpProps {
    email: string;
    otp: string;
}

interface StoreOnboardingMailData {
    store_name: string;
    store_email: string;
    store_phone: string;
    store_address: string;
    documents: {
        cac: string | null;
        utility_bill: string | null;
        tax_clearance: string | null;
    };
    defaultPassword?: string;
}

interface OrderConfirmationMailData {
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
}

////////////////////////////////////////////////////////////            Send mail to school owner
export const sendOnboardingMailToSchoolOwner = async (
    payload: OnboardingMailPayload
): Promise<void> => {
    logger.log("Sending mail to school owner...");

    try {

        // Check if env vars exist (optional but recommended)
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD ||!process.env.otpExpiresAt) {
            throw new Error("SMTP credentials missing in environment variables");
        }

        const htmlContent = onboardingMailTemplate({ ...payload});
        await sendEmailCore({
          to: payload.school_email,
          subject: 'Welcome to Access-sellr',
          html: htmlContent,
          fromName: 'Access-sellr',
        });

        logger.log(`Onboarding email sent to ${payload.school_email}`);
        
    } catch (error) {
        logger.error(`Error sending onboarding email: ${error}`);
        throw ResponseHelper.error(
            "Error sending onboarding email",
            error.message
        )
    }
}

////////////////////////////////////////////////////////////             Send mail to Best tech Admin
export const sendOnboardingMailToBTechAdmin = async (
    payload: OnboardingAdminPayload
): Promise<void> => {
    logger.log("Sending mail to Best Tech...");

    try {

        // Check if env vars exist (optional but recommended)
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD ||!process.env.otpExpiresAt) {
            throw new Error("SMTP credentials missing in environment variables");
        }

        const htmlContent = onboardingSchoolAdminNotificationTemplate({ ...payload});

        const adminEmail = process.env.BTECH_ADMIN_EMAIL || "besttechnologies25@gmail.com"

        await sendEmailCore({
          to: adminEmail,
          subject: 'New Registration on Smart Edu Hub',
          html: htmlContent,
          fromName: 'Smart Edu Hub',
        });

        logger.log(`New school Onboarding email sent to ${adminEmail}`);
        
    } catch (error) {
        logger.error(`Error sending onboarding email to admin: ${error}`);
        throw ResponseHelper.error(
            "Error sending onboarding email",
            error.message
        )
    }
  };
  
  ////////////////////////////////////////////////////////////             Send password reset email
  export const sendPasswordResetOtp = async ({ email, otp }: SendResetOtpProps): Promise<void> => {
    const htmlContent = passwordResetTemplate(otp);
    await sendEmailCore({
      to: email,
      subject: '🔐 Your Password Reset Code',
      html: htmlContent,
      fromName: 'Access Seller',
    });
  };

export const sendLoginOtpByMail = async ({ email, otp}: SendResetOtpProps): Promise<void> => {
  logger.log(`Sending login otp ${otp} to admin email: ${email}`);

  try {
  const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
  const htmlContent = loginOtpTemplate(email, otp, otpExpiresAt);
  await sendEmailCore({
    to: email,
    subject: `Login OTP Confirmation Code: ${otp}`,
    html: htmlContent,
    fromName: 'Access Sellr',
  });

  } catch (error) {
    logger.error(`Error sending otp email: ${error}`);
    throw new Error('Failed to send OTP email');
  }
}

export async function sendOnboardingMailToStoreOwner(data: StoreOnboardingMailData) {
    const { store_name, store_email, store_phone, store_address, documents } = data;

    try {
        // Check if env vars exist
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            throw new Error("SMTP credentials missing in environment variables");
        }

        const mailOptions = {
            from: {
                name: "Acces-Sellr",
                address: process.env.EMAIL_USER as string,
            },
            to: store_email,
            subject: 'Welcome to Acces-Sellr Platform',
            html: `
                <h1>Welcome to Acces-Sellr Platform!</h1>
                <p>Dear ${store_name},</p>
                <p>Thank you for registering your store with Acces-Sellr. Your store details have been received and are being reviewed.</p>
                <p>Store Details:</p>
                <ul>
                    <li>Name: ${store_name}</li>
                    <li>Email: ${store_email}</li>
                    <li>Phone: ${store_phone}</li>
                    <li>Address: ${store_address}</li>
                </ul>
                <p>Documents Submitted:</p>
                <ul>
                    <li>CAC Document: ${documents.cac ? 'Submitted' : 'Not Submitted'}</li>
                    <li>Utility Bill: ${documents.utility_bill ? 'Submitted' : 'Not Submitted'}</li>
                    <li>Tax Clearance: ${documents.tax_clearance ? 'Submitted' : 'Not Submitted'}</li>
                </ul>
                <p>We will review your application and get back to you shortly.</p>
                <p>Best regards,<br>Acces-Sellr Team</p>
            `
        };

        await sendEmailCore({
          to: store_email,
          subject: 'Welcome to Acces-Sellr Platform',
          html: mailOptions.html as string,
          fromName: 'Acces-Sellr',
        });
        logger.log(`Onboarding email sent to store owner: ${store_email}`);
    } catch (error) {
        logger.error(`Error sending onboarding email to store owner: ${error}`);
        throw ResponseHelper.error(
            "Error sending onboarding email",
            error.message
        );
    }
}

export async function sendOnboardingMailToPlatformAdmin(data: StoreOnboardingMailData) {
    const { store_name, store_email, store_phone, store_address, documents, defaultPassword } = data;

    try {
        // Check if env vars exist
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            throw new Error("SMTP credentials missing in environment variables");
        }

        const adminEmail = process.env.ADMIN_EMAIL || "admin@acces-sellr.com";

        const html = `
                <h1>New Store Registration</h1>
                <p>A new store has registered on the Acces-Sellr platform.</p>
                <p>Store Details:</p>
                <ul>
                    <li>Name: ${store_name}</li>
                    <li>Email: ${store_email}</li>
                    <li>Phone: ${store_phone}</li>
                    <li>Address: ${store_address}</li>
                </ul>
                <p>Documents Submitted:</p>
                <ul>
                    <li>CAC Document: ${documents.cac ? 'Submitted' : 'Not Submitted'}</li>
                    <li>Utility Bill: ${documents.utility_bill ? 'Submitted' : 'Not Submitted'}</li>
                    <li>Tax Clearance: ${documents.tax_clearance ? 'Submitted' : 'Not Submitted'}</li>
                </ul>
                <p>Store Manager Default Password: ${defaultPassword}</p>
                <p>Please review the store's application and documents.</p>
                <p>Best regards,<br>Acces-Sellr System</p>
            `;

        await sendEmailCore({
          to: adminEmail,
          subject: 'New Store Registration - Acces-Sellr',
          html,
          fromName: 'Acces-Sellr',
        });
        logger.log(`Onboarding email sent to platform admin: ${adminEmail}`);
    } catch (error) {
        logger.error(`Error sending onboarding email to platform admin: ${error}`);
        throw ResponseHelper.error(
            "Error sending onboarding email",
            error.message
        );
    }
}

////////////////////////////////////////////////////////////             Send order confirmation to buyer
export async function sendOrderConfirmationToBuyer(data: OrderConfirmationMailData) {
    const { email, firstName, lastName, orderId, orderTotal, orderCreated, paymentStatus, trackingNumber, commissionAmount, affiliateUserId } = data;

    try {
        logger.log(`Sending order confirmation email to buyer: ${email}`);

        // Check if env vars exist
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            throw new Error("SMTP credentials missing in environment variables");
        }

        const htmlContent = orderConfirmationBuyerTemplate(data);
        await sendEmailCore({
          to: email,
          subject: `🎉 Order Confirmed - ${orderId}`,
          html: htmlContent,
          fromName: 'Acces-Sellr',
        });
        logger.log(`Order confirmation email sent to buyer: ${email}`);
    } catch (error) {
        logger.error(`Error sending order confirmation email to buyer: ${error}`);
        // throw ResponseHelper.error(
        //     "Error sending order confirmation email",
        //     error.message
        // );
    }
}

////////////////////////////////////////////////////////////             Send order notification to admin
export async function sendOrderNotificationToAdmin(data: OrderConfirmationMailData) {
    const { orderId, orderTotal, firstName, lastName, email, trackingNumber, commissionAmount, affiliateUserId } = data;

    try {
        logger.log("Sending order notification email to admin");

        // Check if env vars exist
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            throw new Error("SMTP credentials missing in environment variables");
        }

        const htmlContent = orderConfirmationAdminTemplate(data);
        const adminEmail = process.env.ADMIN_EMAIL || "admin@acces-sellr.com";
        await sendEmailCore({
          to: adminEmail,
          subject: `🛒 New Order Received - ${orderId}`,
          html: htmlContent,
          fromName: 'Acces-Sellr',
        });
        logger.log(`Order notification email sent to admin: ${adminEmail}`);
    } catch (error) {
        logger.error(`Error sending order notification email to admin: ${error}`);
        throw ResponseHelper.error(
            "Error sending order notification email",
            error.message
        );
    }
}

export async function sendCommissionApprovedMail(props: CommissionApprovedTemplateProps, to: string) {
    const htmlContent = commissionApprovedTemplate(props);
    await sendEmailCore({
      to,
      subject: '🎉 Commission Approved',
      html: htmlContent,
      fromName: 'Acces-Sellr',
    });
}

export async function sendReferralUsedMail(props: ReferralUsedTemplateProps, to: string) {
    const htmlContent = referralUsedTemplate(props);
    await sendEmailCore({
      to,
      subject: `🎉 Your ${props.channel} was used for a purchase!`,
      html: htmlContent,
      fromName: 'Acces-Sellr',
    });
}

export async function sendCommissionApprovalReportMail(props: CommissionApprovalReportProps, adminEmails: string[]) {
    try {
        logger.log(`Sending commission approval report to ${adminEmails.length} admin(s)`);

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            throw new Error("SMTP credentials missing in environment variables");
        }

        const htmlContent = commissionApprovalReportTemplate(props);
        await sendEmailCore({
          to: adminEmails,
          subject: `📊 Commission Approval Report - ${props.reportDate}`,
          html: htmlContent,
          fromName: 'Acces-Sellr Commission System',
        });
        logger.log(`Commission approval report sent successfully to ${adminEmails.length} admin(s)`);
    } catch (error) {
        logger.error(`Error sending commission approval report: ${error}`);
        throw new Error('Failed to send commission approval report');
    }
}

export async function sendCronErrorMailToAdmins(props: CronErrorTemplateProps, adminEmails: string[]) {
    try {
        logger.log(`Sending cron error alert to ${adminEmails.length} admin(s)`);

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            throw new Error("SMTP credentials missing in environment variables");
        }

        const htmlContent = cronErrorTemplate(props);
        await sendEmailCore({
          to: adminEmails,
          subject: `🚨 Cron Service Error Alert - ${props.timestamp}`,
          html: htmlContent,
          fromName: 'Acces-Sellr System Monitor',
        });
        logger.log(`Cron error alert sent successfully to ${adminEmails.length} admin(s)`);
    } catch (error) {
        logger.error(`Error sending cron error alert: ${error}`);
        // Don't throw here - we don't want email failures to crash the app
    }
}