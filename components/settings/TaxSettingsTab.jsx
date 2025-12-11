'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

export function TaxSettingsTab({ taxForm, setTaxForm, saving, onSave }) {
  return (
    <Card elevated={true}>
      <div className='mb-8'>
        <h2
          className='text-neutral-900 mb-2'
          style={{
            fontSize: '28px',
            lineHeight: '36px',
            letterSpacing: '-0.02em',
            fontWeight: '700',
          }}
        >
          Tax Configuration
        </h2>
        <p
          className='text-neutral-600'
          style={{
            fontSize: '16px',
            lineHeight: '24px',
            fontWeight: '400',
          }}
        >
          Set up tax rates and configuration for invoices
        </p>
      </div>
      <div className='space-y-8'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div>
            <label
              className='block text-neutral-700 font-semibold mb-2'
              style={{ fontSize: '14px', lineHeight: '20px' }}
            >
              Country
            </label>
            <Input
              value={taxForm.country}
              onChange={(e) => setTaxForm({ ...taxForm, country: e.target.value })}
              placeholder='e.g., United States'
            />
          </div>

          <div>
            <label
              className='block text-neutral-700 font-semibold mb-2'
              style={{ fontSize: '14px', lineHeight: '20px' }}
            >
              Tax Type
            </label>
            <select
              value={taxForm.taxType}
              onChange={(e) => setTaxForm({ ...taxForm, taxType: e.target.value })}
              className='w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-neutral-900'
              style={{ fontSize: '14px', lineHeight: '20px' }}
            >
              <option value='SALES_TAX'>Sales Tax</option>
              <option value='GST'>GST (Goods and Services Tax)</option>
              <option value='VAT'>VAT (Value Added Tax)</option>
            </select>
          </div>

          <div>
            <label
              className='block text-neutral-700 font-semibold mb-2'
              style={{ fontSize: '14px', lineHeight: '20px' }}
            >
              Tax Rate (%)
            </label>
            <Input
              type='number'
              min='0'
              max='100'
              step='0.01'
              value={taxForm.rate}
              onChange={(e) => setTaxForm({ ...taxForm, rate: parseFloat(e.target.value) || 0 })}
              placeholder='e.g., 8.5'
            />
          </div>
        </div>

        <div className='flex justify-end pt-6 border-t border-neutral-200'>
          <Button onClick={onSave} isLoading={saving} size='md' className='whitespace-nowrap'>
            Save Changes
          </Button>
        </div>
      </div>
    </Card>
  );
}
