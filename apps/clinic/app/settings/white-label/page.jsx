'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Tag } from '@/components/ui/Tag';
import { useI18n } from '@/contexts/I18nContext';
import { showError } from '@/lib/utils/toast';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function WhiteLabelPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    companyName: '',
    customDomain: '',
    removeDoctorsClinicBranding: false,
    customEmailDomain: '',
    customLoginPage: false,
    customTermsUrl: '',
    customPrivacyUrl: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // API for saving white label settings not yet implemented; avoid showing fake success
      const { showInfo } = await import('@/lib/utils/toast');
      showInfo(t('settings.saveNotYetAvailable') || 'Save is not yet available.');
    } catch (error) {
      showError(t('settings.whiteLabelSaveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '0 10px' }}>
      <div className='mb-8'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-neutral-900 dark:text-neutral-100'>{t('settings.whiteLabelSolution')}</h1>
            <p className='text-neutral-600 dark:text-neutral-400 mt-2'>{t('settings.whiteLabelDesc')}</p>
          </div>
          <Tag variant='success'>{t('settings.enterpriseFeature')}</Tag>
        </div>
      </div>

      <form onSubmit={handleSubmit} className='space-y-6' noValidate>
        <Card>
          <h2 className='text-xl font-semibold mb-6 text-neutral-900 dark:text-neutral-100'>{t('settings.companyBranding')}</h2>

          <div className='space-y-6'>
            <Input
              label={t('settings.companyName')}
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              placeholder={t('settings.placeholderCompanyName')}
            />

            <Input
              label={t('settings.customDomain')}
              value={formData.customDomain}
              onChange={(e) => setFormData({ ...formData, customDomain: e.target.value })}
              placeholder={t('settings.placeholderAppDomain')}
            />

            <Input
              label={t('settings.customEmailDomain')}
              value={formData.customEmailDomain}
              onChange={(e) => setFormData({ ...formData, customEmailDomain: e.target.value })}
              placeholder={t('settings.placeholderEmailDomain')}
            />
          </div>
        </Card>

        <Card>
          <h2 className='text-xl font-semibold mb-6 text-neutral-900 dark:text-neutral-100'>{t('settings.doctorsClinicBranding')}</h2>

          <div className='space-y-4'>
            <div className='flex items-center justify-between p-4 bg-neutral-100 dark:bg-neutral-700/60 rounded-lg'>
              <div>
                <h3 className='font-medium text-neutral-900 dark:text-neutral-100'>
                  {t('settings.removeDoctorsClinicBranding')}
                </h3>
                <p className='text-sm text-neutral-600 dark:text-neutral-300 mt-1'>
                  {t('settings.removeDoctorsClinicBrandingDesc')}
                </p>
              </div>
              <label className='relative inline-flex items-center cursor-pointer'>
                <input
                  type='checkbox'
                  checked={formData.removeDoctorsClinicBranding}
                  onChange={(e) =>
                    setFormData({ ...formData, removeDoctorsClinicBranding: e.target.checked })
                  }
                  className='sr-only peer'
                />
                <div className="w-11 h-6 bg-neutral-200 dark:bg-neutral-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after: peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className='flex items-center justify-between p-4 bg-neutral-100 dark:bg-neutral-700/60 rounded-lg'>
              <div>
                <h3 className='font-medium text-neutral-900 dark:text-neutral-100'>{t('settings.customLoginPage')}</h3>
                <p className='text-sm text-neutral-600 dark:text-neutral-300 mt-1'>
                  {t('settings.customLoginPageDesc')}
                </p>
              </div>
              <label className='relative inline-flex items-center cursor-pointer'>
                <input
                  type='checkbox'
                  checked={formData.customLoginPage}
                  onChange={(e) => setFormData({ ...formData, customLoginPage: e.target.checked })}
                  className='sr-only peer'
                />
                <div className="w-11 h-6 bg-neutral-200 dark:bg-neutral-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after: peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className='text-xl font-semibold mb-6 text-neutral-900 dark:text-neutral-100'>{t('settings.customLegalPages')}</h2>

          <div className='space-y-4'>
            <Input
              label={t('settings.customTermsUrl')}
              value={formData.customTermsUrl}
              onChange={(e) => setFormData({ ...formData, customTermsUrl: e.target.value })}
              placeholder={t('settings.placeholderTermsUrl')}
            />

            <Input
              label={t('settings.customPrivacyUrl')}
              value={formData.customPrivacyUrl}
              onChange={(e) => setFormData({ ...formData, customPrivacyUrl: e.target.value })}
              placeholder={t('settings.placeholderPrivacyUrl')}
            />
          </div>
        </Card>

        <Card>
          <div className='bg-primary-100 dark:bg-neutral-800 border-l-4 border-primary-400 dark:border-primary-500 p-4'>
            <h3 className='text-sm font-semibold text-primary-900 dark:text-neutral-100 mb-2'>{t('settings.whiteLabelBenefits')}</h3>
            <ul className='text-sm text-primary-700 dark:text-neutral-200 space-y-1'>
              <li>• {t('settings.whiteLabelBenefit1')}</li>
              <li>• {t('settings.whiteLabelBenefit2')}</li>
              <li>• {t('settings.whiteLabelBenefit3')}</li>
              <li>• {t('settings.whiteLabelBenefit4')}</li>
              <li>• {t('settings.whiteLabelBenefit5')}</li>
            </ul>
          </div>
        </Card>

        <div className='flex justify-end gap-4'>
          <Button type='button' variant='secondary' onClick={() => router.back()} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button type='submit' isLoading={saving} disabled={saving}>
            {t('settings.saveWhiteLabelSettings')}
          </Button>
        </div>
      </form>
    </div>
  );
}
