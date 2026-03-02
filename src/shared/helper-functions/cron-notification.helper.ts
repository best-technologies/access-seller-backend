import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { sendCronErrorMailToAdmins } from '../../common/mailer/send-mail';

const logger = new Logger('CronNotificationHelper');

/**
 * Helper function to send error emails to admins with fallback mechanism
 * 
 * IMPORTANT LIMITATION:
 * - If the SERVER is completely DOWN, this function cannot run because the cron job won't execute
 * - This function works when:
 *   - Server is UP but endpoint ping fails (network issues, endpoint timeout, etc.)
 *   - Server is UP but cron execution has errors
 *   - Server is UP but database/email service has issues (uses fallback)
 * 
 * For server-down scenarios, consider:
 * - External monitoring services (UptimeRobot, Pingdom, etc.)
 * - Separate monitoring server that pings this server
 * 
 * @param prismaService - PrismaService instance to query admin users
 * @param errorMessage - Main error message
 * @param errorDetails - Detailed error information
 * @param endpointUrl - The endpoint URL that was being checked
 * @param timestamp - Timestamp of when the error occurred
 * @returns Promise<boolean> - Returns true if email was sent successfully
 */
export async function sendCronErrorNotification(
  prismaService: PrismaService,
  errorMessage: string,
  errorDetails: string,
  endpointUrl: string,
  timestamp: string
): Promise<boolean> {
  try {
    // Get all admin users (admin and super_admin roles)
    const admins = await prismaService.user.findMany({
      where: {
        role: {
          in: ['admin', 'super_admin']
        },
        is_active: true,
        status: 'active',
      },
      select: {
        email: true,
        first_name: true,
        last_name: true,
      },
    });

    if (admins.length > 0) {
      const adminEmails = admins.map(admin => admin.email).filter(email => email);
      
      if (adminEmails.length > 0) {
        await sendCronErrorMailToAdmins(
          {
            errorMessage,
            endpointUrl,
            timestamp,
            errorDetails,
          },
          adminEmails
        );
        logger.log(`📧 Error notification sent to ${adminEmails.length} admin(s)`);
        return true;
      } else {
        logger.warn('No valid admin emails found to send error notification');
      }
    } else {
      logger.warn('No active admins found in database to send error notification');
    }
  } catch (emailError: any) {
    logger.error(`Failed to send error notification email: ${emailError.message}`);
    // Try to send to fallback admin email if configured
    const fallbackEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    if (fallbackEmail) {
      try {
        await sendCronErrorMailToAdmins(
          {
            errorMessage: `Cron Error + Email Service Error: ${emailError.message}`,
            endpointUrl,
            timestamp,
            errorDetails: `Original Error: ${errorDetails}\nEmail Service Error: ${emailError.stack || emailError.message}`,
          },
          [fallbackEmail]
        );
        logger.log(`📧 Fallback error notification sent to ${fallbackEmail}`);
        return true;
      } catch (fallbackError: any) {
        logger.error(`Failed to send fallback error notification: ${fallbackError.message}`);
      }
    }
  }
  return false;
}

