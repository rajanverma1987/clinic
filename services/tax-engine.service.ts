/**
 * Tax Engine Service
 * Handles region-specific tax calculations (GST, VAT, Sales Tax)
 */

import Tenant from '@/models/Tenant';
import { ITaxBreakdown } from '@/models/Invoice';

export interface TaxCalculationInput {
  region: string;
  taxableAmount: number; // In minor units
  items?: Array<{
    type: string;
    amount: number; // In minor units
    taxRate?: number;
  }>;
}

export interface TaxCalculationResult {
  totalTax: number; // In minor units
  taxBreakdown: ITaxBreakdown[];
  finalAmount: number; // In minor units (taxableAmount + totalTax)
}

/**
 * Get tax configuration for a region
 */
async function getTaxConfig(region: string, tenantId?: string): Promise<{
  taxType: 'GST' | 'VAT' | 'SALES_TAX' | 'NONE';
  rate: number;
  items?: Array<{ type: string; rate: number }>;
}> {
  // If tenant provided, get from tenant settings
  if (tenantId) {
    const tenant = await Tenant.findById(tenantId);
    if (tenant?.settings?.taxRules) {
      return {
        taxType: tenant.settings.taxRules.taxType as any,
        rate: tenant.settings.taxRules.rate || 0,
      };
    }
  }

  // Default tax rules by region
  const defaultTaxRules: Record<string, { taxType: 'GST' | 'VAT' | 'SALES_TAX' | 'NONE'; rate: number }> = {
    US: { taxType: 'SALES_TAX', rate: 0 }, // Varies by state, default 0
    EU: { taxType: 'VAT', rate: 20 }, // Standard VAT rate (varies by country)
    IN: { taxType: 'GST', rate: 18 }, // Standard GST rate
    CA: { taxType: 'GST', rate: 5 }, // GST + HST varies by province
    AU: { taxType: 'GST', rate: 10 }, // Australian GST
    ME: { taxType: 'VAT', rate: 5 }, // UAE/Saudi VAT
    APAC: { taxType: 'VAT', rate: 0 }, // Varies by country
  };

  return defaultTaxRules[region] || { taxType: 'NONE', rate: 0 };
}

/**
 * Calculate tax for a given amount and region
 */
export async function calculateTax(
  input: TaxCalculationInput,
  tenantId?: string
): Promise<TaxCalculationResult> {
  const taxConfig = await getTaxConfig(input.region, tenantId);

  if (taxConfig.taxType === 'NONE' || taxConfig.rate === 0) {
    return {
      totalTax: 0,
      taxBreakdown: [],
      finalAmount: input.taxableAmount,
    };
  }

  const taxBreakdown: ITaxBreakdown[] = [];

  // If items have individual tax rates, calculate per item
  if (input.items && input.items.length > 0) {
    let totalTax = 0;

    for (const item of input.items) {
      const itemTaxRate = item.taxRate || taxConfig.rate;
      const itemTaxAmount = Math.round((item.amount * itemTaxRate) / 100);

      taxBreakdown.push({
        taxType: taxConfig.taxType,
        rate: itemTaxRate,
        amount: itemTaxAmount,
        taxableAmount: item.amount,
      });

      totalTax += itemTaxAmount;
    }

    return {
      totalTax,
      taxBreakdown,
      finalAmount: input.taxableAmount + totalTax,
    };
  }

  // Calculate tax on total amount
  const totalTax = Math.round((input.taxableAmount * taxConfig.rate) / 100);

  taxBreakdown.push({
    taxType: taxConfig.taxType,
    rate: taxConfig.rate,
    amount: totalTax,
    taxableAmount: input.taxableAmount,
  });

  return {
    totalTax,
    taxBreakdown,
    finalAmount: input.taxableAmount + totalTax,
  };
}

/**
 * Format amount for display (convert from minor units to major units)
 */
export function formatAmount(amount: number, currency: string = 'USD'): string {
  // Currency decimal places
  const decimalPlaces: Record<string, number> = {
    USD: 2,
    EUR: 2,
    GBP: 2,
    INR: 2,
    AED: 2,
    SAR: 2,
    AUD: 2,
    CAD: 2,
  };

  const decimals = decimalPlaces[currency] || 2;
  const majorUnits = amount / Math.pow(10, decimals);
  return majorUnits.toFixed(decimals);
}

/**
 * Parse amount to minor units (convert from major units)
 */
export function parseAmount(amount: string | number, currency: string = 'USD'): number {
  const decimalPlaces: Record<string, number> = {
    USD: 2,
    EUR: 2,
    GBP: 2,
    INR: 2,
    AED: 2,
    SAR: 2,
    AUD: 2,
    CAD: 2,
  };

  const decimals = decimalPlaces[currency] || 2;
  const amountNum = typeof amount === 'string' ? parseFloat(amount) : amount;
  return Math.round(amountNum * Math.pow(10, decimals));
}

