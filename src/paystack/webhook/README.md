# Paystack Webhook Module

This module handles Paystack's server-to-server webhook notifications for payment processing.

## Features

- ✅ **Signature Verification** - Securely verifies webhook signatures
- ✅ **Payment Processing** - Handles successful payment webhooks
- ✅ **Commission Handling** - Processes affiliate and referral commissions
- ✅ **Email Notifications** - Sends order confirmation and admin notifications
- ✅ **Stock Management** - Automatically reduces product stock
- ✅ **Error Handling** - Comprehensive error logging and handling

## Setup

### 1. Environment Variables

Add these to your `.env` file:

```env
# Paystack Configuration
PAYSTACK_SECRET_KEY=your_paystack_secret_key_here
PAYSTACK_TEST_SECRET_KEY=your_paystack_test_secret_key_here

# Commission Configuration
AFFILIATE_COMMISSION_PERCENT=20
```

### 2. Paystack Dashboard Configuration

#### **Live Webhook URL:**
```
https://your-domain.com/api/paystack/webhook
```

#### **Test Webhook URL:**
```
https://your-test-domain.com/api/paystack/webhook
```

### 3. Webhook Events Handled

- `charge.success` - Successful payment processing
- `transfer.success` - Successful transfer (placeholder)
- `transfer.failed` - Failed transfer (placeholder)

## API Endpoints

### GET `/api/paystack/webhook`
Test endpoint to verify webhook is active.

**Response:**
```json
{
  "status": "success",
  "message": "Paystack webhook endpoint is active",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### POST `/api/paystack/webhook`
Main webhook endpoint for Paystack notifications.

**Headers:**
- `x-paystack-signature` - Paystack's signature for verification

**Response:**
```json
{
  "status": "success"
}
```

## Payment Processing Flow

1. **Webhook Received** - Paystack sends payment notification
2. **Signature Verification** - Verify webhook authenticity
3. **Order Lookup** - Find order by Paystack reference
4. **Amount Verification** - Ensure paid amount matches expected
5. **Status Update** - Mark order as completed
6. **Stock Reduction** - Decrease product stock
7. **Commission Processing** - Handle affiliate/referral commissions
8. **Email Notifications** - Send confirmation emails

## Commission Handling

### Referral Code Commissions
- Processes orders with `referralCode`
- Creates `CommissionReferral` records
- Updates user wallet balances
- Sends referral notification emails

### Affiliate Link Commissions
- Processes orders with `referralSlug`
- Uses product-specific commission rates
- Updates affiliate link statistics
- Sends affiliate notification emails

## Security Features

- **HMAC-SHA512 Signature Verification**
- **Amount Validation** - Prevents payment manipulation
- **Duplicate Processing Prevention**
- **Comprehensive Error Logging**

## Testing

### Test Webhook Endpoint
```bash
curl -X GET https://your-domain.com/api/paystack/webhook
```

### Simulate Webhook (Development)
```bash
curl -X POST https://your-domain.com/api/paystack/webhook \
  -H "Content-Type: application/json" \
  -H "x-paystack-signature: your_signature" \
  -d '{
    "event": "charge.success",
    "data": {
      "reference": "test_reference",
      "amount": 100000,
      "customer": {
        "email": "test@example.com"
      }
    }
  }'
```

## Error Handling

The webhook service includes comprehensive error handling:

- **Invalid Signatures** - Rejected with error response
- **Missing Orders** - Logged but not fatal
- **Amount Mismatches** - Logged and rejected
- **Database Errors** - Caught and logged
- **Email Failures** - Non-blocking, logged separately

## Monitoring

Monitor webhook processing through:

1. **Application Logs** - Detailed logging for all operations
2. **Database Records** - Order status updates
3. **Email Delivery** - Order confirmation emails
4. **Commission Records** - Affiliate commission tracking

## Production Checklist

- [ ] Set correct `PAYSTACK_SECRET_KEY` in environment
- [ ] Configure webhook URL in Paystack dashboard
- [ ] Test webhook endpoint accessibility
- [ ] Verify signature verification works
- [ ] Test payment processing flow
- [ ] Monitor webhook logs in production
- [ ] Set up error alerting for webhook failures 