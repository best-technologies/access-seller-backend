export interface CronErrorTemplateProps {
    errorMessage: string;
    endpointUrl: string;
    timestamp: string;
    errorDetails?: string;
}

export const cronErrorTemplate = (props: CronErrorTemplateProps): string => {
    const { errorMessage, endpointUrl, timestamp, errorDetails } = props;

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Cron Service Error Alert</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f5f5f5;
                }
                .container {
                    background-color: #ffffff;
                    border-radius: 10px;
                    padding: 30px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .header {
                    text-align: center;
                    border-bottom: 3px solid #dc2626;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .header h1 {
                    color: #dc2626;
                    margin: 0;
                    font-size: 24px;
                    font-weight: 700;
                }
                .alert-box {
                    background-color: #fef2f2;
                    border-left: 4px solid #dc2626;
                    padding: 20px;
                    margin: 20px 0;
                    border-radius: 4px;
                }
                .error-message {
                    color: #dc2626;
                    font-weight: 600;
                    font-size: 16px;
                    margin-bottom: 10px;
                }
                .details {
                    background-color: #f9fafb;
                    border: 1px solid #e5e7eb;
                    border-radius: 6px;
                    padding: 15px;
                    margin: 15px 0;
                    font-family: 'Courier New', monospace;
                    font-size: 13px;
                    color: #374151;
                    word-break: break-all;
                }
                .info-item {
                    margin: 15px 0;
                    padding: 12px;
                    background-color: #f9fafb;
                    border-radius: 6px;
                }
                .info-label {
                    font-weight: 600;
                    color: #6b7280;
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 5px;
                }
                .info-value {
                    color: #1f2937;
                    font-size: 14px;
                }
                .footer {
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #e5e7eb;
                    text-align: center;
                    color: #6b7280;
                    font-size: 12px;
                }
                .action-box {
                    background-color: #eff6ff;
                    border-left: 4px solid #3b82f6;
                    padding: 15px;
                    margin: 20px 0;
                    border-radius: 4px;
                }
                .action-box p {
                    margin: 5px 0;
                    color: #1e40af;
                    font-size: 14px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🚨 Cron Service Error Alert</h1>
                </div>

                <div class="alert-box">
                    <div class="error-message">⚠️ Health Check Failed</div>
                    <p style="color: #6b7280; margin: 0;">The automated health check cron job encountered an error while pinging the endpoint.</p>
                </div>

                <div class="info-item">
                    <div class="info-label">Error Message</div>
                    <div class="info-value">${errorMessage}</div>
                </div>

                <div class="info-item">
                    <div class="info-label">Endpoint URL</div>
                    <div class="info-value">${endpointUrl}</div>
                </div>

                <div class="info-item">
                    <div class="info-label">Timestamp</div>
                    <div class="info-value">${timestamp}</div>
                </div>

                ${errorDetails ? `
                    <div class="info-item">
                        <div class="info-label">Error Details</div>
                        <div class="details">${errorDetails}</div>
                    </div>
                ` : ''}

                <div class="action-box">
                    <p><strong>Action Required:</strong></p>
                    <p>Please investigate the endpoint and server health immediately.</p>
                    <p>Check server logs and verify the endpoint is accessible.</p>
                </div>

                <div class="footer">
                    <p>This is an automated alert from Acces-Sellr Backend System</p>
                    <p>Generated on ${new Date().toLocaleString('en-NG', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit',
                        second: '2-digit'
                    })}</p>
                </div>
            </div>
        </body>
        </html>
    `;
};

