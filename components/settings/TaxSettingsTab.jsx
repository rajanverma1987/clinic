'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

export function TaxSettingsTab({ taxForm, setTaxForm, saving, onSave }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
      className='space-y-4'
    >
      <Card>
        <div className='p-5'>
          <div className='flex items-center gap-2 mb-5'>
            <div className='w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center'>
              <svg
                className='w-4 h-4 text-primary-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
            </div>
            <h2 className='text-lg font-bold text-neutral-900'>Tax Information</h2>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <label className='block text-sm font-medium text-neutral-700 mb-1.5'>Country</label>
              <Input
                value={taxForm.country}
                onChange={(e) => setTaxForm({ ...taxForm, country: e.target.value })}
                placeholder='e.g., United States'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
                Tax Type <span className='text-red-500'>*</span>
              </label>
              <select
                value={taxForm.taxType}
                onChange={(e) => setTaxForm({ ...taxForm, taxType: e.target.value })}
                className='w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-neutral-900 text-sm'
                required
              >
                <option value='SALES_TAX'>Sales Tax</option>
                <option value='GST'>GST (Goods and Services Tax)</option>
                <option value='VAT'>VAT (Value Added Tax)</option>
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
                Tax Rate (%) <span className='text-red-500'>*</span>
              </label>
              <Input
                type='number'
                min='0'
                max='100'
                step='0.01'
                value={taxForm.rate}
                onChange={(e) => setTaxForm({ ...taxForm, rate: parseFloat(e.target.value) || 0 })}
                placeholder='e.g., 8.5'
                required
              />
            </div>
          </div>

          <div className='mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
            <p className='text-xs text-blue-800'>
              <strong>Note:</strong> Tax rates will be automatically applied to all invoices. Ensure
              the tax rate matches your local tax regulations.
            </p>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className='flex justify-end gap-3 pt-2'>
        <Button type='submit' isLoading={saving} disabled={saving}>
          Save Changes
        </Button>
      </div>
    </form>
  );
}
