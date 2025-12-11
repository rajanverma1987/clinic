'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DatePicker } from '@/components/ui/DatePicker';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { showError, showSuccess } from '@/lib/utils/toast';
import { useEffect, useState } from 'react';

export function HolidayManagementTab({ settings, onUpdate }) {
  const { t } = useI18n();
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
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
      console.error('Failed to fetch holidays:', error);
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
        showSuccess('Holiday added successfully');
        if (onUpdate) onUpdate();
      } else {
        showError(response.error?.message || 'Failed to add holiday');
      }
    } catch (error) {
      showError(error.message || 'Failed to add holiday');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHoliday = async (holidayId) => {
    if (!confirm('Are you sure you want to delete this holiday?')) {
      return;
    }
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
        showSuccess('Holiday deleted successfully');
        if (onUpdate) onUpdate();
      } else {
        showError(response.error?.message || 'Failed to delete holiday');
      }
    } catch (error) {
      showError(error.message || 'Failed to delete holiday');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <Loader size='md' inline />
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex justify-end'>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          variant={showAddForm ? 'secondary' : 'primary'}
          size='sm'
        >
          {showAddForm ? 'Cancel' : '+ Add Holiday'}
        </Button>
      </div>

      {/* Add Holiday Form */}
      {showAddForm && (
        <Card>
          <form onSubmit={handleAddHoliday} className='p-5 space-y-4'>
            <h2 className='text-lg font-bold text-neutral-900 mb-4'>Add New Holiday</h2>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
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
            <div className='flex gap-2 pt-3 border-t border-neutral-200'>
              <Button type='submit' isLoading={saving} disabled={saving} className='flex-1'>
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
        <div className='p-5'>
          <div className='flex items-center gap-2 mb-4'>
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
                  d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                />
              </svg>
            </div>
            <h2 className='text-lg font-bold text-neutral-900'>Holidays & Closures</h2>
            <span className='text-sm text-neutral-500'>({holidays.length})</span>
          </div>

          {holidays.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-10 text-neutral-400'>
              <svg className='w-12 h-12 mb-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                />
              </svg>
              <p className='text-sm'>No holidays configured</p>
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
                          d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                        />
                      </svg>
                    </div>
                    <div>
                      <p className='font-semibold text-neutral-900 text-sm'>{holiday.name}</p>
                      <p className='text-xs text-neutral-600'>
                        {new Date(holiday.date).toLocaleDateString('en-US', {
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
