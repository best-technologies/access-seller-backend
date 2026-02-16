/**
 * Converts a number to words for Nigerian Naira amounts.
 * Example: 125000 -> "One Hundred and Twenty-Five Thousand Naira Only"
 */
const ONES = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];
const TENS = [
  '',
  '',
  'Twenty',
  'Thirty',
  'Forty',
  'Fifty',
  'Sixty',
  'Seventy',
  'Eighty',
  'Ninety',
];
const SCALES = ['', 'Thousand', 'Million', 'Billion'];

function upTo999(n: number): string {
  if (n === 0) return '';
  const parts: string[] = [];
  const hundreds = Math.floor(n / 100);
  const remainder = n % 100;
  if (hundreds > 0) {
    parts.push(`${ONES[hundreds]} Hundred`);
  }
  if (remainder >= 20) {
    const tensDigit = Math.floor(remainder / 10);
    const onesDigit = remainder % 10;
    parts.push(TENS[tensDigit]);
    if (onesDigit > 0) parts.push(ONES[onesDigit]);
  } else if (remainder > 0) {
    parts.push(ONES[remainder]);
  }
  return parts.join(' ');
}

export function amountToWords(n: number): string {
  const whole = Math.floor(Math.abs(n));
  if (whole === 0) return 'Zero Naira Only';

  const groups: string[] = [];
  let temp = whole;
  let scaleIdx = 0;

  while (temp > 0) {
    const chunk = temp % 1000;
    if (chunk > 0) {
      const chunkStr = upTo999(chunk).trim();
      const scale = SCALES[scaleIdx];
      groups.unshift(scale ? `${chunkStr} ${scale}` : chunkStr);
    }
    temp = Math.floor(temp / 1000);
    scaleIdx += 1;
  }

  const words = groups.join(' and ');
  return `${words} Naira Only`;
}
