'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useI18n } from '@/contexts/I18nContext';
import { PRIMARY_900 } from '@/lib/constants/brand-colors';
import { showError } from '@/lib/utils/toast';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function BrandingPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    clinicName: '',
    logo: '',
    primaryColor: PRIMARY_900,
    secondaryColor: '#10B981',
    accentColor: '#8B5CF6',
    favicon: '',
    customDomain: '',
    footerText: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // API for saving branding not yet implemented; avoid showing fake success
      const { showInfo } = await import('@/lib/utils/toast');
      showInfo(t('settings.saveNotYetAvailable') || 'Save is not yet available.');
    } catch (error) {
      showError(t('settings.brandingSaveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '0 10px' }}>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-neutral-900'>{t('settings.customBranding')}</h1>
        <p className='text-neutral-600 mt-2'>{t('settings.customBrandingDesc')}</p>
      </div>

      <form onSubmit={handleSubmit} className='space-y-6' noValidate>
        <Card>
          <h2 className='text-xl font-semibold mb-6'>{t('settings.basicBranding')}</h2>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <Input
              label={t('settings.clinicName')}
              value={formData.clinicName}
              onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
              placeholder={t('settings.placeholderClinicName')}
            />

            <Input
              label={t('settings.customDomain')}
              value={formData.customDomain}
              onChange={(e) => setFormData({ ...formData, customDomain: e.target.value })}
              placeholder={t('settings.placeholderCustomDomain')}
            />
          </div>

          <div className='mt-6'>
            <label className='block text-sm font-medium text-neutral-700 mb-2'>
              {t('settings.logoUrl')}
            </label>
            <Input
              value={formData.logo}
              onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
              placeholder={t('settings.placeholderLogoUrl')}
            />
            <p className='text-sm text-neutral-500 mt-1'>{t('settings.logoUrlHint')}</p>
          </div>

          <div className='mt-6'>
            <label className='block text-sm font-medium text-neutral-700 mb-2'>
              {t('settings.faviconUrl')}
            </label>
            <Input
              value={formData.favicon}
              onChange={(e) => setFormData({ ...formData, favicon: e.target.value })}
              placeholder={t('settings.placeholderFaviconUrl')}
            />
            <p className='text-sm text-neutral-500 mt-1'>{t('settings.faviconUrlHint')}</p>
          </div>
        </Card>

        <Card>
          <h2 className='text-xl font-semibold mb-6'>{t('settings.colorScheme')}</h2>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div>
              <label className='block text-sm font-medium text-neutral-700 mb-2'>
                {t('settings.primaryColor')}
              </label>
              <div className='flex gap-2'>
                <input
                  type='color'
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className='h-10 w-20 rounded border border-neutral-300'
                />
                <Input
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  placeholder={PRIMARY_900}
                  className='flex-1'
                />
              </div>
              <div
                className='mt-2 h-10 rounded border'
                style={{ backgroundColor: formData.primaryColor }}
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-neutral-700 mb-2'>
                {t('settings.secondaryColor')}
              </label>
              <div className='flex gap-2'>
                <input
                  type='color'
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  className='h-10 w-20 rounded border border-neutral-300'
                />
                <Input
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  placeholder={t('settings.secondaryColorPlaceholder')}
                  className='flex-1'
                />
              </div>
              <div
                className='mt-2 h-10 rounded border'
                style={{ backgroundColor: formData.secondaryColor }}
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-neutral-700 mb-2'>
                {t('settings.accentColor')}
              </label>
              <div className='flex gap-2'>
                <input
                  type='color'
                  value={formData.accentColor}
                  onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                  className='h-10 w-20 rounded border border-neutral-300'
                />
                <Input
                  value={formData.accentColor}
                  onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                  placeholder={t('settings.accentColorPlaceholder')}
                  className='flex-1'
                />
              </div>
              <div
                className='mt-2 h-10 rounded border'
                style={{ backgroundColor: formData.accentColor }}
              />
            </div>
          </div>
        </Card>

        <Card>
          <h2 className='text-xl font-semibold mb-6'>{t('settings.footerCustomization')}</h2>

          <div>
            <label className='block text-sm font-medium text-neutral-700 mb-2'>
              {t('settings.footerText')}
            </label>
            <textarea
              value={formData.footerText}
              onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
              className='w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500'
              rows={3}
              placeholder={t('settings.placeholderFooterText')}
            />
          </div>
        </Card>

        <div className='flex justify-end gap-4'>
          <Button type='button' variant='secondary' onClick={() => router.back()} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button type='submit' isLoading={saving} disabled={saving}>
            {t('settings.saveBrandingSettings')}
          </Button>
        </div>
      </form>
    </div>
  );
}
