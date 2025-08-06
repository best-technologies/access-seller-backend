export interface CommissionApprovalReportProps {
    reportDate: string;
    totalCommissionsProcessed: number;
    totalCommissionsApproved: number;
    totalCommissionsSkipped: number;
    totalAmountApproved: number;
    approvedCommissions: Array<{
        commissionId: string;
        orderId: string;
        commissionOwnerId: string;
        commissionOwnerName: string;
        commissionOwnerEmail: string;
        purchaserId: string;
        purchaserName: string;
        purchaserEmail: string;
        referrerId?: string;
        referrerName?: string;
        referrerEmail?: string;
        productId: string;
        productName: string;
        orderTotal: number;
        commissionAmount: number;
        commissionPercentage: string;
        orderCreatedDate: string;
        orderDeliveredDate: string;
        daysSinceDelivery: number;
    }>;
    skippedCommissions: Array<{
        commissionId: string;
        orderId: string;
        reason: string;
        commissionOwnerId: string;
        commissionOwnerName: string;
        orderTotal: number;
        commissionAmount: number;
        orderCreatedDate: string;
        orderStatus?: string;
    }>;
}

export const commissionApprovalReportTemplate = (props: CommissionApprovalReportProps): string => {
    const {
        reportDate,
        totalCommissionsProcessed,
        totalCommissionsApproved,
        totalCommissionsSkipped,
        totalAmountApproved,
        approvedCommissions,
        skippedCommissions
    } = props;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN'
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-NG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Commission Approval Report</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 1200px;
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
                    border-bottom: 3px solid #2563eb;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .header h1 {
                    color: #2563eb;
                    margin: 0;
                    font-size: 28px;
                    font-weight: 700;
                }
                .header p {
                    color: #6b7280;
                    margin: 10px 0 0 0;
                    font-size: 16px;
                }
                .summary-cards {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }
                .summary-card {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 20px;
                    border-radius: 8px;
                    text-align: center;
                }
                .summary-card h3 {
                    margin: 0 0 10px 0;
                    font-size: 14px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .summary-card .number {
                    font-size: 32px;
                    font-weight: bold;
                    margin: 0;
                }
                .section {
                    margin-bottom: 40px;
                }
                .section h2 {
                    color: #1f2937;
                    border-bottom: 2px solid #e5e7eb;
                    padding-bottom: 10px;
                    margin-bottom: 20px;
                    font-size: 20px;
                }
                .table-container {
                    overflow-x: auto;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    background-color: white;
                    font-size: 14px;
                }
                th {
                    background-color: #f8fafc;
                    color: #374151;
                    font-weight: 600;
                    text-align: left;
                    padding: 12px 15px;
                    border-bottom: 2px solid #e5e7eb;
                    text-transform: uppercase;
                    font-size: 12px;
                    letter-spacing: 0.5px;
                }
                td {
                    padding: 12px 15px;
                    border-bottom: 1px solid #f3f4f6;
                    vertical-align: top;
                }
                tr:hover {
                    background-color: #f9fafb;
                }
                .status-approved {
                    background-color: #dcfce7;
                    color: #166534;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 600;
                }
                .status-skipped {
                    background-color: #fef3c7;
                    color: #92400e;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 600;
                }
                .amount {
                    font-weight: 600;
                    color: #059669;
                }
                .commission-id {
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    color: #6b7280;
                }
                .user-info {
                    font-size: 13px;
                    line-height: 1.4;
                }
                .footer {
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #e5e7eb;
                    text-align: center;
                    color: #6b7280;
                    font-size: 14px;
                }
                .no-data {
                    text-align: center;
                    padding: 40px;
                    color: #6b7280;
                    font-style: italic;
                }
                @media (max-width: 768px) {
                    .container {
                        padding: 15px;
                    }
                    .summary-cards {
                        grid-template-columns: 1fr;
                    }
                    table {
                        font-size: 12px;
                    }
                    th, td {
                        padding: 8px 10px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📊 Commission Approval Report</h1>
                    <p>Daily automated report for ${reportDate}</p>
                </div>

                <div class="summary-cards">
                    <div class="summary-card">
                        <h3>Total Processed</h3>
                        <p class="number">${totalCommissionsProcessed}</p>
                    </div>
                    <div class="summary-card">
                        <h3>Approved</h3>
                        <p class="number">${totalCommissionsApproved}</p>
                    </div>
                    <div class="summary-card">
                        <h3>Skipped</h3>
                        <p class="number">${totalCommissionsSkipped}</p>
                    </div>
                    <div class="summary-card">
                        <h3>Total Amount</h3>
                        <p class="number">${formatCurrency(totalAmountApproved)}</p>
                    </div>
                </div>

                <div class="section">
                    <h2>✅ Approved Commissions (${approvedCommissions.length})</h2>
                    ${approvedCommissions.length > 0 ? `
                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Commission ID</th>
                                        <th>Order ID</th>
                                        <th>Commission Owner</th>
                                        <th>Purchaser</th>
                                        <th>Referrer</th>
                                        <th>Product</th>
                                        <th>Order Total</th>
                                        <th>Commission</th>
                                        <th>Order Date</th>
                                        <th>Days Since Delivery</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${approvedCommissions.map(commission => `
                                        <tr>
                                            <td>
                                                <div class="commission-id">${commission.commissionId}</div>
                                            </td>
                                            <td>
                                                <div class="commission-id">${commission.orderId}</div>
                                            </td>
                                            <td>
                                                <div class="user-info">
                                                    <strong>${commission.commissionOwnerName}</strong><br>
                                                    <small>${commission.commissionOwnerEmail}</small><br>
                                                    <small>ID: ${commission.commissionOwnerId}</small>
                                                </div>
                                            </td>
                                            <td>
                                                <div class="user-info">
                                                    <strong>${commission.purchaserName}</strong><br>
                                                    <small>${commission.purchaserEmail}</small><br>
                                                    <small>ID: ${commission.purchaserId}</small>
                                                </div>
                                            </td>
                                            <td>
                                                ${commission.referrerId ? `
                                                    <div class="user-info">
                                                        <strong>${commission.referrerName}</strong><br>
                                                        <small>${commission.referrerEmail}</small><br>
                                                        <small>ID: ${commission.referrerId}</small>
                                                    </div>
                                                ` : '<small>Direct Purchase</small>'}
                                            </td>
                                            <td>
                                                <div class="user-info">
                                                    <strong>${commission.productName}</strong><br>
                                                    <small>ID: ${commission.productId}</small>
                                                </div>
                                            </td>
                                            <td>
                                                <div class="amount">${formatCurrency(commission.orderTotal)}</div>
                                            </td>
                                            <td>
                                                <div class="amount">${formatCurrency(commission.commissionAmount)}</div>
                                                <small>${commission.commissionPercentage}%</small>
                                            </td>
                                            <td>
                                                <small>${formatDate(commission.orderCreatedDate)}</small>
                                            </td>
                                            <td>
                                                <span class="status-approved">${commission.daysSinceDelivery} days</span>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    ` : '<div class="no-data">No commissions were approved today.</div>'}
                </div>

                <div class="section">
                    <h2>⏭️ Skipped Commissions (${skippedCommissions.length})</h2>
                    ${skippedCommissions.length > 0 ? `
                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Commission ID</th>
                                        <th>Order ID</th>
                                        <th>Commission Owner</th>
                                        <th>Order Total</th>
                                        <th>Commission Amount</th>
                                        <th>Order Date</th>
                                        <th>Reason</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${skippedCommissions.map(commission => `
                                        <tr>
                                            <td>
                                                <div class="commission-id">${commission.commissionId}</div>
                                            </td>
                                            <td>
                                                <div class="commission-id">${commission.orderId}</div>
                                            </td>
                                            <td>
                                                <div class="user-info">
                                                    <strong>${commission.commissionOwnerName}</strong><br>
                                                    <small>ID: ${commission.commissionOwnerId}</small>
                                                </div>
                                            </td>
                                            <td>
                                                <div class="amount">${formatCurrency(commission.orderTotal)}</div>
                                            </td>
                                            <td>
                                                <div class="amount">${formatCurrency(commission.commissionAmount)}</div>
                                            </td>
                                            <td>
                                                <small>${formatDate(commission.orderCreatedDate)}</small>
                                            </td>
                                            <td>
                                                <span class="status-skipped">${commission.reason}</span>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    ` : '<div class="no-data">No commissions were skipped today.</div>'}
                </div>

                <div class="footer">
                    <p>This report was automatically generated by the Acces-Sellr Commission Approval System.</p>
                    <p>Generated on ${new Date().toLocaleString('en-NG')}</p>
                </div>
            </div>
        </body>
        </html>
    `;
}; 