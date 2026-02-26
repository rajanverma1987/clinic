import { logger } from '@/lib/utils/logger.js';

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
    logger.warn(`Invalid currency code: ${currencyCode}, falling back to USD`);
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

/**
 * Conversion rates to USD (1 unit of fromCurrency = rate USD). Used for display when tenant currency differs from plan currency.
 * Update periodically or source from settings for accuracy.
 */
const RATE_TO_USD = {
  USD: 1,
  INR: 0.012,   // ~83 INR = 1 USD
  EUR: 1.08,
  GBP: 1.27,
  CAD: 0.74,
  AUD: 0.65,
  JPY: 0.0067,
};

/**
 * Convert amount from one currency to another for display.
 * Amount is in minor units (cents/paise); returns object { amountMajor, currency } for formatting.
 * @param {number} amountMinor - Amount in minor units (cents or paise)
 * @param {string} fromCurrency - Plan/store currency (e.g. 'INR', 'USD')
 * @param {string} toCurrency - Tenant/location display currency
 * @returns {{ amountMajor: number, currency: string }}
 */
export function convertAmountForDisplay(amountMinor, fromCurrency, toCurrency) {
  if (!amountMinor || amountMinor === 0) {
    return { amountMajor: 0, currency: toCurrency || fromCurrency };
  }
  const from = (fromCurrency || 'USD').toUpperCase();
  const to = (toCurrency || from).toUpperCase();
  if (from === to) {
    return { amountMajor: amountMinor / 100, currency: to };
  }
  const toUsd = RATE_TO_USD[from] ?? 1;
  const fromUsd = RATE_TO_USD[to] ?? 1;
  const amountMajor = (amountMinor / 100) * toUsd * (1 / fromUsd);
  return { amountMajor, currency: to };
}

