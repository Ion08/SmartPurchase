export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(value);
}

export function formatNumber(value: number, digits = 0) {
  return new Intl.NumberFormat('en-GB', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value);
}
