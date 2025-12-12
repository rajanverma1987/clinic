'use client';

import { Layout } from '@/components/layout/Layout';
import { ClinicHoursTab } from '@/components/settings/ClinicHoursTab';
import { ComplianceTab } from '@/components/settings/ComplianceTab';
import { DoctorsTab } from '@/components/settings/DoctorsTab';
import { GeneralSettingsTab } from '@/components/settings/GeneralSettingsTab';
import { HolidayManagementTab } from '@/components/settings/HolidayManagementTab';
import { ProfileTab } from '@/components/settings/ProfileTab';
import { QueueSettingsTab } from '@/components/settings/QueueSettingsTab';
import { SettingsTabs } from '@/components/settings/SettingsTabs';
import { SMTPSettingsTab } from '@/components/settings/SMTPSettingsTab';
import { TaxSettingsTab } from '@/components/settings/TaxSettingsTab';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { showError, showSuccess } from '@/lib/utils/toast';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const router = useRouter();
  const { user: currentUser, loading: authLoading, logout } = useAuth();
  const { t } = useI18n();
  // Set initial tab based on role - profile for non-admins, general for admins
  const [activeTab, setActiveTab] = useState(() => {
    // This will be set properly after user loads
    return 'profile';
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [users, setUsers] = useState([]);

  // Form states
  const [clinicForm, setClinicForm] = useState({
    name: '',
    region: 'US',
    currency: 'USD',
    locale: 'en-US',
    timezone: 'America/New_York',
    prescriptionValidityDays: 30,
  });

  const [complianceForm, setComplianceForm] = useState({
    hipaa: false,
    gdpr: false,
    pipeda: false,
    privacyAct: false,
    dataRetentionYears: 7,
  });

  const [queueForm, setQueueForm] = useState({
    displayOrder: 'priority',
    averageConsultationTime: 30,
    enablePublicDisplay: false,
    showEstimatedWaitTime: true,
    autoCallNext: false,
    maxQueueLength: 50,
  });

  const [taxForm, setTaxForm] = useState({
    country: '',
    taxType: 'SALES_TAX',
    rate: 0,
  });

  const [smtpForm, setSmtpForm] = useState({
    enabled: false,
    host: '',
    port: 587,
    secure: false,
    user: '',
    password: '',
    fromEmail: '',
    fromName: '',
    rejectUnauthorized: true,
  });

  const [availabilityForm, setAvailabilityForm] = useState({
    isDayOff: false,
    dayOffDate: '',
    dayOffReason: '',
    isEmergencyOff: false,
    emergencyOffReason: '',
    emergencyOffUntil: '',
  });

  const [clinicHours, setClinicHours] = useState([
    { day: 'Monday', isOpen: true, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] },
    { day: 'Tuesday', isOpen: true, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] },
    { day: 'Wednesday', isOpen: true, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] },
    { day: 'Thursday', isOpen: true, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] },
    { day: 'Friday', isOpen: true, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] },
    { day: 'Saturday', isOpen: false, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] },
    { day: 'Sunday', isOpen: false, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] },
  ]);

  const [newUserForm, setNewUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'doctor',
  });
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');

  useEffect(() => {
    if (!authLoading && currentUser) {
      fetchSettings();
      // Only fetch users if user is clinic_admin
      if (currentUser.role === 'clinic_admin') {
        fetchUsers();
      }
      // Redirect to profile if non-admin tries to access restricted tabs
      if (
        currentUser.role !== 'clinic_admin' &&
        ['general', 'compliance', 'doctors'].includes(activeTab)
      ) {
        setActiveTab('profile');
      }
    }
  }, [authLoading, currentUser]);

  // Separate effect to handle tab changes and access control
  useEffect(() => {
    if (
      currentUser &&
      currentUser.role !== 'clinic_admin' &&
      ['general', 'compliance', 'doctors'].includes(activeTab)
    ) {
      setActiveTab('profile');
    }
  }, [activeTab, currentUser]);

  // Handle ESC key to close new user form
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showNewUserForm) {
        setShowNewUserForm(false);
      }
    };

    if (showNewUserForm) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showNewUserForm]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/settings');
      if (response.success && response.data) {
        const data = response.data;
        console.log('Fetched settings data:', JSON.stringify(data, null, 2));
        setSettings(data);
        setClinicForm({
          name: data.name,
          region: data.region,
          currency: data.settings.currency,
          locale: data.settings.locale,
          timezone: data.settings.timezone,
          prescriptionValidityDays: data.settings.prescriptionValidityDays || 30,
        });
        setComplianceForm({
          hipaa: data.settings.complianceSettings?.hipaa || false,
          gdpr: data.settings.complianceSettings?.gdpr || false,
          pipeda: data.settings.complianceSettings?.pipeda || false,
          privacyAct: data.settings.complianceSettings?.privacyAct || false,
          dataRetentionYears: data.settings.dataRetentionYears || 7,
        });
        setQueueForm({
          displayOrder: data.settings.queueSettings?.displayOrder || 'priority',
          averageConsultationTime: data.settings.queueSettings?.averageConsultationTime || 30,
          enablePublicDisplay: data.settings.queueSettings?.enablePublicDisplay || false,
          showEstimatedWaitTime: data.settings.queueSettings?.showEstimatedWaitTime ?? true,
          autoCallNext: data.settings.queueSettings?.autoCallNext || false,
          maxQueueLength: data.settings.queueSettings?.maxQueueLength || 50,
        });
        if (data.settings.taxRules) {
          setTaxForm({
            country: data.settings.taxRules.country || '',
            taxType: data.settings.taxRules.taxType || 'SALES_TAX',
            rate: data.settings.taxRules.rate || 0,
          });
        }
        // Load SMTP settings
        if (data.settings.smtp) {
          setSmtpForm({
            enabled: data.settings.smtp.enabled || false,
            host: data.settings.smtp.host || '',
            port: data.settings.smtp.port || 587,
            secure: data.settings.smtp.secure || false,
            user: data.settings.smtp.user || '',
            password: '', // Never load password
            fromEmail: data.settings.smtp.fromEmail || '',
            fromName: data.settings.smtp.fromName || '',
            rejectUnauthorized: data.settings.smtp.rejectUnauthorized !== false,
          });
        }
        // Load clinic hours with backward compatibility
        if (
          data.settings.clinicHours &&
          Array.isArray(data.settings.clinicHours) &&
          data.settings.clinicHours.length > 0
        ) {
          const hours = data.settings.clinicHours.map((hour) => {
            // Handle old format (startTime/endTime) or new format (timeSlots)
            if (hour.timeSlots && Array.isArray(hour.timeSlots) && hour.timeSlots.length > 0) {
              return {
                day: hour.day,
                isOpen: hour.isOpen !== false,
                timeSlots: hour.timeSlots,
              };
            } else if (hour.startTime && hour.endTime) {
              // Convert old format to new format
              return {
                day: hour.day,
                isOpen: hour.isOpen !== false,
                timeSlots: [{ startTime: hour.startTime, endTime: hour.endTime }],
              };
            }
            // Fallback: return default structure
            return {
              day: hour.day || 'Monday',
              isOpen: hour.isOpen !== false,
              timeSlots: [{ startTime: '09:00', endTime: '17:00' }],
            };
          });
          // Ensure we have all 7 days
          const daysOfWeek = [
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
            'Sunday',
          ];
          const loadedDays = hours.map((h) => h.day);
          const missingDays = daysOfWeek.filter((day) => !loadedDays.includes(day));
          const completeHours = [...hours];
          missingDays.forEach((day) => {
            completeHours.push({
              day,
              isOpen: day === 'Saturday' || day === 'Sunday' ? false : true,
              timeSlots: [{ startTime: '09:00', endTime: '17:00' }],
            });
          });
          // Sort by day of week
          completeHours.sort((a, b) => {
            return daysOfWeek.indexOf(a.day) - daysOfWeek.indexOf(b.day);
          });
          setClinicHours(completeHours);
        } else {
          // If no clinic hours saved, keep the default state (already set in useState)
          console.log('No clinic hours found in settings, using defaults');
        }
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      showError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get('/users');
      if (response.success && response.data) {
        // Handle wrapped response structure - data is inside response.data.data
        const usersList = response.data.data || [];
        setUsers(Array.isArray(usersList) ? usersList : []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleSaveGeneral = async () => {
    setSaving(true);
    try {
      const response = await apiClient.put('/settings', {
        name: clinicForm.name,
        region: clinicForm.region,
        settings: {
          currency: clinicForm.currency,
          locale: clinicForm.locale,
          timezone: clinicForm.timezone,
          prescriptionValidityDays: clinicForm.prescriptionValidityDays,
        },
      });
      if (response.success) {
        showSuccess('Clinic settings saved successfully');
        fetchSettings();
      } else {
        showError(response.error?.message || 'Failed to save settings');
      }
    } catch (error) {
      showError(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCompliance = async () => {
    setSaving(true);
    try {
      const response = await apiClient.put('/settings', {
        settings: {
          complianceSettings: {
            hipaa: complianceForm.hipaa,
            gdpr: complianceForm.gdpr,
            pipeda: complianceForm.pipeda,
            privacyAct: complianceForm.privacyAct,
          },
          dataRetentionYears: complianceForm.dataRetentionYears,
        },
      });
      if (response.success) {
        showSuccess('Compliance settings saved successfully');
        fetchSettings();
      } else {
        showError(response.error?.message || 'Failed to save settings');
      }
    } catch (error) {
      showError(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveQueue = async () => {
    setSaving(true);
    try {
      const response = await apiClient.put('/settings', {
        settings: {
          queueSettings: queueForm,
        },
      });
      if (response.success) {
        showSuccess('Queue settings saved successfully');
        fetchSettings();
      } else {
        showError(response.error?.message || 'Failed to save settings');
      }
    } catch (error) {
      showError(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTax = async () => {
    setSaving(true);
    try {
      const response = await apiClient.put('/settings', {
        settings: {
          taxRules: taxForm,
        },
      });
      if (response.success) {
        showSuccess('Tax settings saved successfully');
        fetchSettings();
      } else {
        showError(response.error?.message || 'Failed to save settings');
      }
    } catch (error) {
      showError(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSmtp = async () => {
    setSaving(true);
    try {
      // Only send password if it was changed (not empty)
      const smtpData = { ...smtpForm };
      if (!smtpData.password) {
        // Remove password from update if not provided
        delete smtpData.password;
      }

      const response = await apiClient.put('/settings', {
        settings: {
          smtp: smtpData,
        },
      });
      if (response.success) {
        showSuccess('SMTP settings saved successfully');
        // Clear password field after save
        setSmtpForm({ ...smtpForm, password: '' });
        fetchSettings();
      } else {
        showError(response.error?.message || 'Failed to save settings');
      }
    } catch (error) {
      showError(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveHours = async () => {
    setSaving(true);
    try {
      // Validate clinicHours data before sending
      const validHours = clinicHours.map((hour) => ({
        day: hour.day,
        isOpen: hour.isOpen,
        timeSlots: hour.timeSlots.filter((slot) => slot.startTime && slot.endTime),
      }));

      console.log('Saving clinic hours:', JSON.stringify(validHours, null, 2));

      const response = await apiClient.put(
        '/settings',
        {
          settings: {
            clinicHours: validHours,
          },
        },
        {},
        true
      ); // skipRedirect = true to prevent automatic logout

      if (response.success) {
        showSuccess('Clinic hours saved successfully');
        // Don't refetch immediately to avoid race conditions
        setTimeout(() => {
          fetchSettings();
        }, 500);
      } else {
        const errorMessage = response.error?.message || 'Failed to save settings';
        console.error('Failed to save clinic hours:', response.error);

        // If it's an auth error, show a more helpful message
        if (response.error?.code === 'UNAUTHORIZED' || response.error?.code === 'FORBIDDEN') {
          showError('Your session may have expired. Please try refreshing the page.');
        } else {
          showError(errorMessage);
        }
      }
    } catch (error) {
      console.error('Error saving clinic hours:', error);
      showError(error.message || 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateClinicHour = (index, field, value) => {
    const updated = [...clinicHours];
    updated[index] = { ...updated[index], [field]: value };
    // If opening a day and it has no time slots, add one
    if (field === 'isOpen' && value === true && updated[index].timeSlots.length === 0) {
      updated[index].timeSlots = [{ startTime: '09:00', endTime: '17:00' }];
    }
    setClinicHours(updated);
  };

  const addTimeSlot = (dayIndex) => {
    const updated = [...clinicHours];
    updated[dayIndex].timeSlots.push({ startTime: '09:00', endTime: '17:00' });
    setClinicHours(updated);
  };

  const removeTimeSlot = (dayIndex, slotIndex) => {
    const updated = [...clinicHours];
    if (updated[dayIndex].timeSlots.length > 1) {
      updated[dayIndex].timeSlots.splice(slotIndex, 1);
      setClinicHours(updated);
    }
  };

  const updateTimeSlot = (dayIndex, slotIndex, field, value) => {
    const updated = [...clinicHours];
    updated[dayIndex].timeSlots[slotIndex] = {
      ...updated[dayIndex].timeSlots[slotIndex],
      [field]: value,
    };
    setClinicHours(updated);
  };

  const generatePassword = () => {
    // Generate a secure random password
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setGeneratedPassword(password);
    setNewUserForm({ ...newUserForm, password: password });
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      console.log('Creating user with data:', { ...newUserForm, password: '***' });
      const response = await apiClient.post('/users', newUserForm);
      if (response.success) {
        showSuccess('User created successfully');
        setNewUserForm({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          role: 'doctor',
        });
        setGeneratedPassword('');
        setShowNewUserForm(false);
        fetchUsers();
      } else {
        const errorMessage = response.error?.message || 'Failed to create user';
        const errorDetails = response.error?.details
          ? JSON.stringify(response.error.details, null, 2)
          : '';
        const fullMessage = errorDetails
          ? `${errorMessage}\n\nDetails:\n${errorDetails}`
          : errorMessage;
        showError(fullMessage);
        console.error('Failed to create user:', response.error);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      showError(error.message || 'Failed to create user');
    }
  };

  const handleToggleUserStatus = async (userId, isActive) => {
    try {
      const response = await apiClient.put(`/users/${userId}`, { isActive: !isActive });
      if (response.success) {
        fetchUsers();
        showSuccess(`User ${!isActive ? 'activated' : 'deactivated'} successfully`);
      } else {
        const errorMessage =
          typeof response.error === 'string'
            ? response.error
            : response.error?.message || 'Failed to update user';
        showError(errorMessage);
      }
    } catch (error) {
      const errorMessage =
        error?.message || (typeof error === 'string' ? error : 'Failed to update user');
      showError(errorMessage);
    }
  };

  const handleToggleMyStatus = async (e) => {
    if (!currentUser) return;
    e?.preventDefault?.();
    try {
      setSaving(true);
      const newStatus = !currentUser.isActive;
      const userId = currentUser.userId || currentUser.id;
      if (!userId) {
        showError('User ID not found. Please refresh the page.');
        setSaving(false);
        return;
      }
      const response = await apiClient.put(`/users/${userId}`, {
        isActive: newStatus,
      });
      if (response.success) {
        showSuccess(`Status updated to ${newStatus ? 'Active' : 'Inactive'}`);
        // Refresh user data
        setTimeout(() => {
          window.location.reload(); // Simple refresh to update user context
        }, 500);
      } else {
        const errorMessage =
          typeof response.error === 'string'
            ? response.error
            : response.error?.message || 'Failed to update status';
        showError(errorMessage);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      const errorMessage =
        error?.message ||
        (typeof error === 'string' ? error : 'Failed to update status. Please try again.');
      showError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Redirect if not authenticated (non-blocking)
  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
  }, [authLoading, currentUser, router]);

  // Show empty state while redirecting
  if (!currentUser) {
    return null;
  }

  if (loading) {
    return <Loader fullScreen size='lg' />;
  }

  // Filter tabs based on user role
  const isClinicAdmin = currentUser?.role === 'clinic_admin';

  return (
    <Layout>
      <div style={{ padding: '0 10px' }}>
        {/* Header */}
        <div className='mb-6'>
          <h1 className='text-2xl font-bold text-neutral-900 mb-1'>
            {t('settings.title') || 'Settings'}
          </h1>
          <p className='text-sm text-neutral-600'>
            {t('settings.description') || 'Manage your clinic settings and preferences'}
          </p>
        </div>

        {/* Tabs Navigation */}
        <SettingsTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isClinicAdmin={isClinicAdmin}
        />

        {/* Profile Settings */}
        {activeTab === 'profile' && (
          <ProfileTab
            currentUser={currentUser}
            logout={logout}
            saving={saving}
            onToggleStatus={handleToggleMyStatus}
            availabilityForm={availabilityForm}
            setAvailabilityForm={setAvailabilityForm}
          />
        )}

        {/* General Settings - Admin Only */}
        {activeTab === 'general' && (
          <GeneralSettingsTab
            isClinicAdmin={isClinicAdmin}
            clinicForm={clinicForm}
            setClinicForm={setClinicForm}
            saving={saving}
            onSave={handleSaveGeneral}
          />
        )}

        {/* Compliance Settings - Admin Only */}
        {activeTab === 'compliance' && (
          <ComplianceTab
            isClinicAdmin={isClinicAdmin}
            complianceForm={complianceForm}
            setComplianceForm={setComplianceForm}
            saving={saving}
            onSave={handleSaveCompliance}
          />
        )}

        {/* Doctors & Staff - Admin Only */}
        {activeTab === 'doctors' && (
          <DoctorsTab
            isClinicAdmin={isClinicAdmin}
            users={users}
            newUserForm={newUserForm}
            setNewUserForm={setNewUserForm}
            showNewUserForm={showNewUserForm}
            setShowNewUserForm={setShowNewUserForm}
            generatedPassword={generatedPassword}
            setGeneratedPassword={setGeneratedPassword}
            onGeneratePassword={generatePassword}
            onCreateUser={handleCreateUser}
            onToggleUserStatus={handleToggleUserStatus}
          />
        )}

        {/* Clinic Hours */}
        {activeTab === 'hours' && (
          <ClinicHoursTab
            clinicHours={clinicHours}
            updateClinicHour={updateClinicHour}
            addTimeSlot={addTimeSlot}
            removeTimeSlot={removeTimeSlot}
            updateTimeSlot={updateTimeSlot}
            saving={saving}
            onSave={handleSaveHours}
          />
        )}

        {/* Queue Settings */}
        {activeTab === 'queue' && (
          <QueueSettingsTab
            queueForm={queueForm}
            setQueueForm={setQueueForm}
            saving={saving}
            onSave={handleSaveQueue}
          />
        )}

        {/* Tax Settings */}
        {activeTab === 'tax' && (
          <TaxSettingsTab
            taxForm={taxForm}
            setTaxForm={setTaxForm}
            saving={saving}
            onSave={handleSaveTax}
          />
        )}

        {/* SMTP/Email Settings */}
        {activeTab === 'smtp' && (
          <SMTPSettingsTab
            smtpForm={smtpForm}
            setSmtpForm={setSmtpForm}
            saving={saving}
            onSave={handleSaveSmtp}
          />
        )}

        {/* Holiday Management */}
        {activeTab === 'holidays' && (
          <HolidayManagementTab settings={settings} onUpdate={fetchSettings} />
        )}
      </div>
    </Layout>
  );
}
