'use client';

import { CalendarIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DatePicker } from '@/components/ui/DatePicker';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { useConfirmation } from '@/contexts/ConfirmationContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { logger } from '@/lib/utils/logger.js';
import { showError, showSuccess } from '@/lib/utils/toast';
import { useEffect, useState } from 'react';
import { SettingsTabHeader } from './SettingsTabHeader';

export function HolidayManagementTab({
  settings,
  onUpdate,
  showAddForm: controlledShowAdd,
  setShowAddForm: setControlledShowAdd,
}) {
  const { t } = useI18n();
  const { open: openConfirm } = useConfirmation();
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [internalShowAdd, setInternalShowAdd] = useState(false);
  const showAddForm = controlledShowAdd !== undefined ? controlledShowAdd : internalShowAdd;
  const setShowAddForm = setControlledShowAdd || setInternalShowAdd;
  const addButtonInHeader = controlledShowAdd !== undefined;
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    isRecurring: false,
    recurringYear: new Date().getFullYear(),
  });

  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/settings');
      if (response.success && response.data) {
        setHolidays(response.data.settings?.holidays || []);
      }
    } catch (error) {
      logger.error('Failed to fetch holidays:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updatedHolidays = [...holidays, { ...formData, id: Date.now().toString() }];
      const response = await apiClient.put('/settings', {
        settings: {
          holidays: updatedHolidays,
        },
      });
      if (response.success) {
        setHolidays(updatedHolidays);
        setFormData({
          name: '',
          date: '',
          isRecurring: false,
          recurringYear: new Date().getFullYear(),
        });
        setShowAddForm(false);
        showSuccess(t('errors.holidayAdded'));
        if (onUpdate) onUpdate();
      } else {
        showError(response.error?.message || t('errors.failedToAddHoliday'));
      }
    } catch (error) {
      showError(error.message || t('errors.failedToAddHoliday'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHoliday = async (holidayId) => {
    openConfirm({
      title: t('common.delete'),
      message: t('errors.confirmDeleteHoliday'),
      onConfirm: async () => {
        setSaving(true);
        try {
          const updatedHolidays = holidays.filter((h) => h.id !== holidayId);
          const response = await apiClient.put('/settings', {
            settings: {
              holidays: updatedHolidays,
            },
          });
          if (response.success) {
            setHolidays(updatedHolidays);
            showSuccess(t('errors.holidayDeleted'));
            if (onUpdate) onUpdate();
          } else {
            showError(response.error?.message || t('errors.failedToDeleteHoliday'));
          }
        } catch (error) {
          showError(error.message || t('errors.failedToDeleteHoliday'));
        } finally {
          setSaving(false);
        }
      },
    });
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <Loader type='section' text={t('common.loading')} />
      </div>
    );
  }

  return (
    <div className='w-full max-w-4xl space-y-6 text-left'>
      <SettingsTabHeader title={t('settings.holidaysClosures')} />
      <div className='flex justify-end'>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          variant={showAddForm ? 'secondary' : 'primary'}
          size='sm'
        >
          {showAddForm ? t('common.cancel') : `+ ${t('settings.addHoliday')}`}
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <form onSubmit={handleAddHoliday} className='p-5 space-y-4'>
            <h3 className='text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4'>
              {t('settings.addNewHoliday')}
            </h3>
            <div className='content-grid-2 content-grid-gap-3'>
              <div>
                <label className='block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5'>
                  {t('settings.holidayNameLabel')} <span className='text-red-500'>*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('settings.holidayNamePlaceholder')}
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5'>
                  {t('settings.dateLabel')} <span className='text-red-500'>*</span>
                </label>
                <DatePicker
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <input
                type='checkbox'
                checked={formData.isRecurring}
                onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                className='h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 dark:border-neutral-600 rounded'
              />
              <label className='text-sm text-neutral-700 dark:text-neutral-300'>
                {t('settings.recurringEveryYear')}
              </label>
            </div>
            <div className='flex gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-600'>
              <Button
                type='submit'
                variant='primary'
                isLoading={saving}
                disabled={saving}
                className='flex-1'
              >
                {t('settings.addHolidayButton')}
              </Button>
              <Button
                type='button'
                variant='secondary'
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({
                    name: '',
                    date: '',
                    isRecurring: false,
                    recurringYear: new Date().getFullYear(),
                  });
                }}
                className='flex-1'
              >
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <div className='p-5'>
          <h3 className='text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4'>
            {t('settings.holidaysClosures')}{' '}
            <span className='text-sm font-normal text-neutral-500 dark:text-neutral-400'>
              ({holidays.length})
            </span>
          </h3>

          {holidays.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-10 text-neutral-400 dark:text-neutral-500'>
              <CalendarIcon className='icon icon-xl mb-2' ariaHidden />
              <p className='text-sm'>{t('settings.noHolidaysConfigured')}</p>
              <p className='text-xs mt-1'>{t('settings.addHolidaysHint')}</p>
            </div>
          ) : (
            <div className='space-y-2'>
              {holidays.map((holiday) => (
                <div
                  key={holiday.id}
                  className='flex items-center justify-between p-3 border border-neutral-200 dark:border-neutral-600 rounded-lg hover:border-primary-300 dark:hover:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all'
                >
                  <div className='flex items-center gap-3'>
                    <div>
                      <p className='font-semibold text-neutral-900 dark:text-neutral-100 text-sm'>
                        {holiday.name}
                      </p>
                      <p className='text-xs text-neutral-600 dark:text-neutral-400'>
                        {new Date(holiday.date).toLocaleDateString(undefined, {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                        {holiday.isRecurring && (
                          <span className='ml-2 px-1.5 py-0.5 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-xs rounded-full'>
                            {t('settings.recurring')}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant='danger'
                    size='sm'
                    onClick={() => handleDeleteHoliday(holiday.id)}
                    disabled={saving}
                  >
                    {t('common.delete')}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
