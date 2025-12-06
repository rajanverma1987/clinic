/**
 * Currency formatting utility
 * Formats amounts based on currency code from settings
 */

/**
 * Format currency amount
 * @param {number} amount - Amount in minor units (cents)
 * @param {string} currencyCode - ISO currency code (e.g., 'USD', 'EUR', 'INR')
 * @param {string} locale - Locale string (e.g., 'en-US', 'en-IN')
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currencyCode = 'USD', locale = 'en-US') {
  if (amount === null || amount === undefined) {
    return getCurrencySymbol(currencyCode) + '0.00';
  }

  // Convert from minor units (cents) to major units (dollars)
  const majorAmount = amount / 100;

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
    }).format(majorAmount);
  } catch (error) {
    // Fallback if currency code is invalid
    console.warn(`Invalid currency code: ${currencyCode}, falling back to USD`);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(majorAmount);
  }
}

/**
 * Get currency symbol for a currency code
 * @param {string} currencyCode - ISO currency code
 * @returns {string} Currency symbol
 */
export function getCurrencySymbol(currencyCode = 'USD') {
  const symbolMap = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    CAD: 'C$',
    AUD: 'A$',
    JPY: '¥',
    CNY: '¥',
    MXN: '$',
    BRL: 'R$',
  };

  return symbolMap[currencyCode] || '$';
}

/**
 * Get locale based on currency code
 * @param {string} currencyCode - ISO currency code
 * @returns {string} Locale string
 */
export function getLocaleForCurrency(currencyCode = 'USD') {
  const localeMap = {
    USD: 'en-US',
    EUR: 'en-EU',
    GBP: 'en-GB',
    INR: 'en-IN',
    CAD: 'en-CA',
    AUD: 'en-AU',
    JPY: 'ja-JP',
    CNY: 'zh-CN',
    MXN: 'es-MX',
    BRL: 'pt-BR',
  };

  return localeMap[currencyCode] || 'en-US';
}

