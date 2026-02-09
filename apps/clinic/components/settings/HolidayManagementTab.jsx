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
    <div className='space-y-3 text-left'>
      <SettingsTabHeader title={t('settings.holidaysClosures')} />
      {/* Always show Add New Holiday button (toggle form visibility only) */}
      <div className='flex justify-end'>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          variant={showAddForm ? 'secondary' : 'primary'}
          size='sm'
        >
          {showAddForm ? t('common.cancel') : `+ ${t('settings.addHoliday')}`}
        </Button>
      </div>

      {/* Add Holiday Form */}
      {showAddForm && (
        <Card>
          <form onSubmit={handleAddHoliday} className='p-4 space-y-3'>
            <h2 className='text-base font-bold text-neutral-900 mb-3'>
              {t('settings.addNewHoliday')}
            </h2>
            <div className='content-grid-2 content-grid-gap-3'>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
                  Holiday Name <span className='text-red-500'>*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder='e.g., New Year, Christmas'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
                  Date <span className='text-red-500'>*</span>
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
                className='h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded'
              />
              <label className='text-sm text-neutral-700'>Recurring every year</label>
            </div>
            <div className='flex gap-2 pt-2 border-t border-neutral-200'>
              <Button
                type='submit'
                variant='primary'
                isLoading={saving}
                disabled={saving}
                className='flex-1'
              >
                Add Holiday
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
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Holidays List */}
      <Card>
        <div className='p-4'>
          <div className='flex items-center gap-2 mb-3'>
            <div className='w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center'>
              <CalendarIcon className='icon icon-xs text-primary-600' ariaHidden />
            </div>
            <h2 className='text-lg font-bold text-neutral-900'>{t('settings.holidaysClosures')}</h2>
            <span className='text-sm text-neutral-500'>({holidays.length})</span>
          </div>

          {holidays.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-10 text-neutral-400'>
              <CalendarIcon className='icon icon-xl mb-2' ariaHidden />
              <p className='text-sm'>{t('settings.noHolidaysConfigured')}</p>
              <p className='text-xs mt-1'>
                Add holidays to block appointment scheduling on those dates
              </p>
            </div>
          ) : (
            <div className='space-y-2'>
              {holidays.map((holiday) => (
                <div
                  key={holiday.id}
                  className='flex items-center justify-between p-3 border border-neutral-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all'
                >
                  <div className='flex items-center gap-3'>
                    <div className='w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center'>
                      <CalendarIcon className='icon icon-xs text-primary-600' ariaHidden />
                    </div>
                    <div>
                      <p className='font-semibold text-neutral-900 text-sm'>{holiday.name}</p>
                      <p className='text-xs text-neutral-600'>
                        {new Date(holiday.date).toLocaleDateString(undefined, {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                        {holiday.isRecurring && (
                          <span className='ml-2 px-1.5 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full'>
                            Recurring
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
                    Delete
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
