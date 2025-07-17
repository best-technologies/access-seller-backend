export function parseAndNormalizeCheckoutDto(paymentData: any): any {
  // Parse JSON fields if they are strings
  if (typeof paymentData.items === 'string') {
    paymentData.items = JSON.parse(paymentData.items);
  }
  if (typeof paymentData.partialPayment === 'string') {
    paymentData.partialPayment = JSON.parse(paymentData.partialPayment);
  }
  if (typeof paymentData.fullPayment === 'string') {
    paymentData.fullPayment = JSON.parse(paymentData.fullPayment);
  }
  if (typeof paymentData.shippingInfo === 'string') {
    paymentData.shippingInfo = JSON.parse(paymentData.shippingInfo);
  }
  // Convert number fields from string to number if needed
  const numberFields = [
    'total', 'subtotal', 'shipping', 'totalItems',
    'referralDiscountPercent', 'referralDiscountAmount',
    'promoDiscountPercent', 'promoDiscountAmount'
  ];
  for (const field of numberFields) {
    if (typeof paymentData[field] === 'string') {
      paymentData[field] = parseFloat(paymentData[field]);
    }
  }
  // Convert numbers in partialPayment
  if (paymentData.partialPayment) {
    const partialFields = ['allowedPercentage', 'selectedPercentage', 'payNow', 'payLater', 'toBalance'];
    for (const field of partialFields) {
      if (typeof paymentData.partialPayment[field] === 'string') {
        paymentData.partialPayment[field] = parseFloat(paymentData.partialPayment[field]);
      }
    }
  }
  // Convert numbers in fullPayment
  if (paymentData.fullPayment) {
    const fullFields = ['total', 'payNow', 'payLater'];
    for (const field of fullFields) {
      if (typeof paymentData.fullPayment[field] === 'string') {
        paymentData.fullPayment[field] = parseFloat(paymentData.fullPayment[field]);
      }
    }
  }
  // Convert numbers in items array
  if (Array.isArray(paymentData.items)) {
    for (const item of paymentData.items) {
      if (typeof item.quantity === 'string') item.quantity = parseFloat(item.quantity);
      if (typeof item.price === 'string') item.price = parseFloat(item.price);
      if (typeof item.subtotal === 'string') item.subtotal = parseFloat(item.subtotal);
    }
  }
  return paymentData;
} 