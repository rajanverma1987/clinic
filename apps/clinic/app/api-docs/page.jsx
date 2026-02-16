'use client';

import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { showSuccess } from '@/lib/utils/toast';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function APIDocsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  useEffect(() => {
    if (authLoading) return;
    if (user?.role !== 'super_admin') {
      router.replace('/dashboard');
    }
  }, [user, authLoading, router]);
  const { t } = useI18n();
  const [apiToken, setApiToken] = useState('');
  const [showToken, setShowToken] = useState(false);

  const generateToken = () => {
    // In production, this would call an API to generate a real API key
    const token = `sk_${user?.tenantId}_${Date.now()}`;
    setApiToken(token);
    setShowToken(true);
  };

  const endpoints = [
    {
      category: 'Patients',
      items: [
        { method: 'GET', path: '/api/patients', description: 'List all patients' },
        { method: 'POST', path: '/api/patients', description: 'Create new patient' },
        { method: 'GET', path: '/api/patients/{id}', description: 'Get patient details' },
        { method: 'PUT', path: '/api/patients/{id}', description: 'Update patient' },
      ],
    },
    {
      category: 'Appointments',
      items: [
        { method: 'GET', path: '/api/appointments', description: 'List appointments' },
        { method: 'POST', path: '/api/appointments', description: 'Create appointment' },
        { method: 'PUT', path: '/api/appointments/{id}', description: 'Update appointment' },
        { method: 'PUT', path: '/api/appointments/{id}/status', description: 'Update status' },
      ],
    },
    {
      category: 'Queue',
      items: [
        { method: 'GET', path: '/api/queue', description: 'Get current queue' },
        { method: 'POST', path: '/api/queue', description: 'Add to queue' },
        { method: 'PUT', path: '/api/queue/{id}/status', description: 'Update queue status' },
      ],
    },
    {
      category: 'Prescriptions',
      items: [
        { method: 'GET', path: '/api/prescriptions', description: 'List prescriptions' },
        { method: 'POST', path: '/api/prescriptions', description: 'Create prescription' },
        {
          method: 'POST',
          path: '/api/prescriptions/{id}/dispense',
          description: 'Dispense medication',
        },
      ],
    },
    {
      category: 'Invoices',
      items: [
        { method: 'GET', path: '/api/invoices', description: 'List invoices' },
        { method: 'POST', path: '/api/invoices', description: 'Create invoice' },
        { method: 'POST', path: '/api/payments', description: 'Record payment' },
      ],
    },
    {
      category: 'Inventory',
      items: [
        { method: 'GET', path: '/api/inventory/items', description: 'List inventory items' },
        { method: 'POST', path: '/api/inventory/items', description: 'Create item' },
        { method: 'POST', path: '/api/inventory/transactions', description: 'Stock transaction' },
      ],
    },
    {
      category: 'Reports',
      items: [
        { method: 'GET', path: '/api/reports/dashboard', description: 'Dashboard metrics' },
        { method: 'GET', path: '/api/reports/revenue', description: 'Revenue report' },
        { method: 'GET', path: '/api/reports/patients', description: 'Patient statistics' },
        { method: 'GET', path: '/api/reports/appointments', description: 'Appointment analytics' },
      ],
    },
  ];

  if (authLoading || user?.role !== 'super_admin') {
    return (
      <Layout>
        <div className='mb-8'>
          <p className='text-neutral-600'>{t('common.loading')}</p>
        </div>
      </Layout>
    );
  }

  const getMethodColor = (method) => {
    const colors = {
      GET: 'bg-primary-100 text-primary-700',
      POST: 'bg-secondary-100 text-secondary-700',
      PUT: 'bg-status-warning/10 text-status-warning',
      DELETE: 'bg-status-error/10 text-status-error',
    };
    return colors[method] || 'bg-neutral-100 text-neutral-700';
  };

  return (
    <Layout>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900'>{t('apiDocs.title')}</h1>
        <p className='text-neutral-600 mt-2'>{t('apiDocs.subtitle')}</p>
      </div>

      {/* API Key Section */}
      <Card className='mb-8'>
        <h2 className='text-xl font-semibold mb-4'>{t('apiDocs.authentication')}</h2>
        <p className='text-neutral-600 mb-4'>{t('apiDocs.authenticationDesc')}</p>

        {!showToken ? (
          <Button onClick={generateToken}>{t('common.generateApiKey')}</Button>
        ) : (
          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                {t('apiDocs.apiKeyLabel')}
              </label>
              <div className='flex gap-2'>
                <input
                  type='text'
                  readOnly
                  value={apiToken}
                  className='flex-1 px-3 py-2 border border-neutral-300 rounded-lg bg-neutral-100 font-mono text-sm'
                />
                <Button
                  variant='secondary'
                  onClick={() => {
                    navigator.clipboard.writeText(apiToken);
                    showSuccess(t('apiDocs.copied') || 'API key copied to clipboard!');
                  }}
                >
                  {t('apiDocs.copy')}
                </Button>
              </div>
            </div>

            <div className='bg-status-warning/10 border-l-4 border-status-warning p-4'>
              <p className='text-sm text-status-warning'>
                <strong>⚠️ {t('apiDocs.securityLabel')}:</strong> {t('apiDocs.securityWarning')}
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Quick Start */}
      <Card className='mb-8'>
        <h2 className='text-xl font-semibold mb-4'>{t('apiDocs.quickStart')}</h2>
        <div className='bg-neutral-100 text-neutral-900 border border-neutral-300 p-4 rounded-lg overflow-x-auto'>
          <pre className='text-sm'>
            {`// JavaScript/Node.js Example
const response = await fetch('https://yourapp.com/api/patients', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
// data contains the API response`}
          </pre>
        </div>
      </Card>

      {/* API Endpoints */}
      <Card>
        <h2 className='text-xl font-semibold mb-6'>{t('apiDocs.endpoints')}</h2>

        <div className='space-y-8'>
          {endpoints.map((category) => (
            <div key={category.category}>
              <h3 className='text-lg font-semibold text-gray-900 mb-4 border-b pb-2'>
                {category.category}
              </h3>

              <div className='space-y-3'>
                {category.items.map((endpoint, idx) => (
                  <div
                    key={idx}
                    className='flex items-start gap-4 p-3 hover:bg-neutral-100 rounded-lg'
                  >
                    <span
                      className={`px-3 py-1 rounded-md text-xs font-semibold ${getMethodColor(
                        endpoint.method,
                      )}`}
                    >
                      {endpoint.method}
                    </span>
                    <div className='flex-1'>
                      <code className='text-sm font-mono text-gray-800'>{endpoint.path}</code>
                      <p className='text-sm text-neutral-600 mt-1'>{endpoint.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className='mt-8 pt-6 border-t'>
          <h3 className='text-lg font-semibold mb-4'>{t('apiDocs.responseFormat')}</h3>
          <div className='bg-neutral-100 text-neutral-900 border border-neutral-300 p-4 rounded-lg overflow-x-auto'>
            <pre className='text-sm'>
              {`// Success Response
{
  "success": true,
  "data": { ... }
}

// Error Response
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}`}
            </pre>
          </div>
        </div>
      </Card>

      {/* Rate Limits */}
      <Card className='mt-6'>
        <h2 className='text-xl font-semibold mb-4'>{t('apiDocs.rateLimits')}</h2>
        <p className='text-neutral-600 mb-4'>{t('apiDocs.rateLimitsDesc')}</p>
        <ul className='space-y-2 text-sm text-gray-700'>
          <li>• {t('apiDocs.freeTrial')}</li>
          <li>• {t('apiDocs.basic')}</li>
          <li>• {t('apiDocs.professional')}</li>
          <li>• {t('apiDocs.enterprise')}</li>
        </ul>
      </Card>
    </Layout>
  );
}
