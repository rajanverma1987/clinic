'use client';

import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { ClinicHoursTab } from '@/components/settings/ClinicHoursTab';
import { ComplianceTab } from '@/components/settings/ComplianceTab';
import { DoctorsTab } from '@/components/settings/DoctorsTab';
import { GeneralSettingsTab } from '@/components/settings/GeneralSettingsTab';
import { HolidayManagementTab } from '@/components/settings/HolidayManagementTab';
import { ProfileTab } from '@/components/settings/ProfileTab';
import { QueueSettingsTab } from '@/components/settings/QueueSettingsTab';
import {
  getSettingsTabPanelId,
  getSettingsTabPanelLabelledBy,
  SettingsTabs,
} from '@/components/settings/SettingsTabs';
import { SMTPSettingsTab } from '@/components/settings/SMTPSettingsTab';
import { TaxSettingsTab } from '@/components/settings/TaxSettingsTab';
import { Card } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { ACTIONS, hasPermission, RESOURCES } from '@/lib/permissions/constants';
import { extractArrayData } from '@/lib/utils/api-response-extractor';
import { showError, showSuccess } from '@/lib/utils/toast';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useDeferredValue, useEffect, useState } from 'react';

const SETTINGS_TAB_IDS = [
  'profile',
  'general',
  'compliance',
  'doctors',
  'hours',
  'queue',
  'tax',
  'smtp',
  'holidays',
];
const ADMIN_ONLY_TABS = ['general', 'compliance', 'doctors', 'smtp'];

/** Tab id → breadcrumb label (must match SettingsTabs labels for i18n). */
function getSettingsTabLabel(t, tabId) {
  const labels = {
    profile: t('settings.profile'),
    general: t('settings.clinicInfo'),
    compliance: t('settings.compliance'),
    doctors: t('settings.doctorsStaff'),
    hours: t('settings.clinicHours'),
    queue: t('settings.queueSettings'),
    tax: t('settings.taxSettings'),
    smtp: t('settings.emailSettings') || 'Email Settings',
    holidays: 'Holidays',
  };
  return labels[tabId] || tabId;
}

function SettingsPageFallback() {
  const { t } = useI18n();
  return (
    <Layout>
      <PageHeader title='Settings' />
      <div className='flex justify-center p-8'>
        <Loader type='page' text={t('common.loading')} />
      </div>
    </Layout>
  );
}

function SettingsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user: currentUser, loading: authLoading, logout } = useAuth();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState('general');
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
  const [showHolidayAddForm, setShowHolidayAddForm] = useState(false);

  // Who can access settings (and thus admin-only tabs like Clinic info): doctor, clinic_admin
  const canAccessSettings = hasPermission(currentUser?.role, RESOURCES.SETTINGS, ACTIONS.READ);

  // Sync tab from URL when URL has a tab param (don't overwrite with profile when param missing – avoids reverting after tab click before URL updates)
  useEffect(() => {
    if (authLoading || !currentUser) return;
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && SETTINGS_TAB_IDS.includes(tabFromUrl)) {
      const canOpenTab = !ADMIN_ONLY_TABS.includes(tabFromUrl) || canAccessSettings;
      if (canOpenTab) {
        setActiveTab(tabFromUrl);
        return;
      }
      // User cannot access this tab (e.g. manager with admin-only tab in URL): switch to profile
      router.replace((pathname || '/settings') + '?tab=profile');
      setActiveTab('profile');
      return;
    }
    if (tabFromUrl === 'profile') {
      setActiveTab('profile');
    } else if (!tabFromUrl || tabFromUrl === '') {
      setActiveTab('general');
    }
  }, [authLoading, currentUser, canAccessSettings, searchParams, pathname, router]);

  useEffect(() => {
    if (!authLoading && currentUser) {
      fetchSettings();
      if (currentUser.role === 'clinic_admin') {
        fetchUsers();
      }
    }
  }, [authLoading, currentUser]);

  // Manager has no Settings access (per permission matrix) – redirect to dashboard
  useEffect(() => {
    if (!authLoading && currentUser && !canAccessSettings) {
      router.replace('/dashboard');
    }
  }, [authLoading, currentUser, canAccessSettings, router]);

  // Enforce: users without admin tabs must not stay on admin-only tabs (e.g. URL bookmark)
  const canAccessAdminTabs = canAccessSettings;
  useEffect(() => {
    if (currentUser && !canAccessAdminTabs && ADMIN_ONLY_TABS.includes(activeTab)) {
      setActiveTab('profile');
      router.replace((pathname || '/settings') + '?tab=profile');
    }
  }, [activeTab, currentUser, canAccessAdminTabs, pathname, router]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    queueMicrotask(() => {
      router.replace((pathname || '/settings') + '?tab=' + encodeURIComponent(tabId));
    });
  };

  const deferredTab = useDeferredValue(activeTab);
  const isTabPending = activeTab !== deferredTab;

  // Reset header-controlled form state when leaving tab
  useEffect(() => {
    if (activeTab !== 'holidays') setShowHolidayAddForm(false);
  }, [activeTab]);

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
        }
      }
    } catch (error) {
      showError(t('errors.failedToLoadSettings'));
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get('/users');
      if (response.success && response.data) {
        const usersList = extractArrayData(response);
        setUsers(Array.isArray(usersList) ? usersList : []);
      }
    } catch (_error) {
      // Fetch users failed
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
        showSuccess(t('errors.clinicSettingsSaved'));
        fetchSettings();
      } else {
        showError(response.error?.message || t('errors.failedToSaveSettings'));
      }
    } catch (error) {
      showError(error.message || t('errors.failedToSaveSettings'));
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
        showSuccess(t('errors.complianceSettingsSaved'));
        fetchSettings();
      } else {
        showError(response.error?.message || t('errors.failedToSaveSettings'));
      }
    } catch (error) {
      showError(error.message || t('errors.failedToSaveSettings'));
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
        showSuccess(t('errors.queueSettingsSaved'));
        fetchSettings();
      } else {
        showError(response.error?.message || t('errors.failedToSaveSettings'));
      }
    } catch (error) {
      showError(error.message || t('errors.failedToSaveSettings'));
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
        showSuccess(t('errors.taxSettingsSaved'));
        fetchSettings();
      } else {
        showError(response.error?.message || t('errors.failedToSaveSettings'));
      }
    } catch (error) {
      showError(error.message || t('errors.failedToSaveSettings'));
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
        showSuccess(t('errors.smtpSettingsSaved'));
        // Clear password field after save
        setSmtpForm({ ...smtpForm, password: '' });
        fetchSettings();
      } else {
        showError(response.error?.message || t('errors.failedToSaveSettings'));
      }
    } catch (error) {
      showError(error.message || t('errors.failedToSaveSettings'));
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

      const response = await apiClient.put(
        '/settings',
        {
          settings: {
            clinicHours: validHours,
          },
        },
        {},
        true,
      ); // skipRedirect = true to prevent automatic logout

      if (response.success) {
        showSuccess(t('errors.clinicHoursSaved'));
        // Don't refetch immediately to avoid race conditions
        setTimeout(() => {
          fetchSettings();
        }, 500);
      } else {
        const errorMessage = response.error?.message || t('errors.failedToSaveSettings');

        if (response.error?.code === 'UNAUTHORIZED' || response.error?.code === 'FORBIDDEN') {
          showError(t('errors.sessionExpired'));
        } else {
          showError(errorMessage);
        }
      }
    } catch (error) {
      showError(error.message || t('errors.failedToSaveSettingsRetry'));
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
      const response = await apiClient.post('/users', newUserForm);
      if (response.success) {
        showSuccess(t('errors.userCreatedSuccess'));
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
        const errorMessage = response.error?.message || t('errors.failedToCreateUser');
        const errorDetails = response.error?.details
          ? JSON.stringify(response.error.details, null, 2)
          : '';
        const fullMessage = errorDetails
          ? `${errorMessage}\n\nDetails:\n${errorDetails}`
          : errorMessage;
        showError(fullMessage);
      }
    } catch (error) {
      showError(error.message || t('errors.failedToCreateUser'));
    }
  };

  const handleToggleUserStatus = async (userId, isActive) => {
    try {
      const response = await apiClient.put(`/users/${userId}`, { isActive: !isActive });
      if (response.success) {
        fetchUsers();
        showSuccess(
          !isActive ? t('errors.userActivatedSuccess') : t('errors.userDeactivatedSuccess'),
        );
      } else {
        const errorMessage =
          typeof response.error === 'string'
            ? response.error
            : response.error?.message || t('errors.failedToCreateUser');
        showError(errorMessage);
      }
    } catch (error) {
      const errorMessage =
        error?.message || (typeof error === 'string' ? error : t('errors.failedToCreateUser'));
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
        showError(t('errors.userIdNotFound'));
        setSaving(false);
        return;
      }
      const response = await apiClient.put(`/users/${userId}`, {
        isActive: newStatus,
      });
      if (response.success) {
        showSuccess(
          t('errors.statusUpdated', { status: t(newStatus ? 'common.active' : 'common.inactive') }),
        );
        // Refresh user data
        setTimeout(() => {
          window.location.reload(); // Simple refresh to update user context
        }, 500);
      } else {
        const errorMessage =
          typeof response.error === 'string'
            ? response.error
            : response.error?.message || t('errors.failedToSaveSettings');
        showError(errorMessage);
      }
    } catch (error) {
      const errorMessage =
        error?.message ||
        (typeof error === 'string' ? error : t('errors.failedToSaveSettingsRetry'));
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
    return <Loader type='page' text={t('common.loading')} />;
  }

  // Manager has no Settings access – show loader while redirect runs (redirect in useEffect above)
  if (!authLoading && currentUser && !canAccessSettings) {
    return (
      <Layout>
        <Loader type='page' text={t('auth.redirectingToLogin')} />
      </Layout>
    );
  }

  // Doctor and Clinic Admin can access all settings tabs and add staff
  const isClinicAdmin = currentUser?.role === 'clinic_admin' || currentUser?.role === 'doctor';

  // Per-tab action buttons for header bar (compact, always visible)
  const tabActionButtons = (() => {
    if (activeTab === 'general') {
      return (
        <Button onClick={handleSaveGeneral} isLoading={saving} disabled={saving} size='sm'>
          {t('settings.saveChanges') || 'Save Changes'}
        </Button>
      );
    }
    if (activeTab === 'compliance') {
      return (
        <Button onClick={handleSaveCompliance} isLoading={saving} disabled={saving} size='sm'>
          {t('settings.saveChanges') || 'Save Changes'}
        </Button>
      );
    }
    if (activeTab === 'doctors' && isClinicAdmin) {
      return showNewUserForm ? (
        <Button variant='secondary' onClick={() => setShowNewUserForm(false)} size='sm'>
          {t('common.cancel') || 'Cancel'}
        </Button>
      ) : (
        <Button onClick={() => setShowNewUserForm(true)} size='sm'>
          + {t('settings.addUser') || 'Add User'}
        </Button>
      );
    }
    if (activeTab === 'hours') {
      return (
        <Button onClick={handleSaveHours} isLoading={saving} disabled={saving} size='sm'>
          {t('settings.saveHours') || 'Save Hours'}
        </Button>
      );
    }
    if (activeTab === 'queue') {
      return (
        <Button onClick={handleSaveQueue} isLoading={saving} disabled={saving} size='sm'>
          {t('settings.saveChanges') || 'Save Changes'}
        </Button>
      );
    }
    if (activeTab === 'tax') {
      return (
        <Button onClick={handleSaveTax} isLoading={saving} disabled={saving} size='sm'>
          {t('settings.saveChanges') || 'Save Changes'}
        </Button>
      );
    }
    if (activeTab === 'smtp') {
      return (
        <Button onClick={handleSaveSmtp} isLoading={saving} disabled={saving} size='sm'>
          {t('settings.saveChanges') || 'Save Changes'}
        </Button>
      );
    }
    if (activeTab === 'holidays') {
      return showHolidayAddForm ? (
        <Button variant='secondary' onClick={() => setShowHolidayAddForm(false)} size='sm'>
          {t('common.cancel') || 'Cancel'}
        </Button>
      ) : (
        <Button onClick={() => setShowHolidayAddForm(true)} size='sm'>
          + {t('settings.addHoliday') || 'Add Holiday'}
        </Button>
      );
    }
    return null;
  })();

  return (
    <Layout>
      <PageHeader
        title={t('settings.title') || 'Settings'}
        subtitle={t('settings.description') || 'Manage your clinic settings and preferences'}
        breadcrumbs={[
          { label: t('settings.title') || 'Settings', href: '/settings' },
          { label: getSettingsTabLabel(t, activeTab) },
        ]}
        notifications={[]}
        unreadCount={0}
        actionButton={tabActionButtons}
      />
      <div className='data-tabs-container w-full'>
        {/* Tabs bar below header – full width within container */}
        <SettingsTabs
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          canAccessAdminTabs={canAccessAdminTabs}
        />

        {/* Tab content: standard width; accessible tabpanel for active tab */}
        <div
          className='tab-content-standard-width mt-4'
          role='tabpanel'
          id={getSettingsTabPanelId(activeTab)}
          aria-labelledby={getSettingsTabPanelLabelledBy(activeTab)}
          aria-busy={isTabPending}
        >
          {isTabPending && (
            <div className='flex min-h-[200px] items-center justify-center py-8'>
              <Loader type='section' text={t('common.loading')} />
            </div>
          )}
          {!isTabPending && deferredTab === 'profile' && (
            <div className='w-full'>
              <ProfileTab
                currentUser={currentUser}
                logout={logout}
                saving={saving}
                onToggleStatus={handleToggleMyStatus}
                availabilityForm={availabilityForm}
                setAvailabilityForm={setAvailabilityForm}
                onEditProfileClick={() => handleTabChange('profile')}
              />

              {/* Create Manager Account - Only for Doctors and Clinic Admins */}
              {(currentUser?.role === 'doctor' || currentUser?.role === 'clinic_admin') && (
                <Card className='mt-4'>
                  <div className='p-4'>
                    <div className='flex items-center justify-between mb-3'>
                      <div>
                        <h3 className='text-lg font-semibold text-neutral-900'>
                          {t('settings.managerAccounts')}
                        </h3>
                        <p className='text-sm text-neutral-600 mt-1'>
                          {t('settings.managerAccountsDesc')}
                        </p>
                      </div>
                      <Button
                        variant='primary'
                        onClick={() => router.push('/settings/create-manager')}
                      >
                        {t('settings.createManagerButton')}
                      </Button>
                    </div>
                    <div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
                      <p className='text-sm text-blue-800'>{t('settings.managerAccountsNotice')}</p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* General Settings - Admin Only */}
          {!isTabPending && deferredTab === 'general' && (
            <GeneralSettingsTab
              isClinicAdmin={isClinicAdmin}
              clinicForm={clinicForm}
              setClinicForm={setClinicForm}
              saving={saving}
              onSave={handleSaveGeneral}
            />
          )}

          {/* Compliance Settings - Admin Only */}
          {!isTabPending && deferredTab === 'compliance' && (
            <ComplianceTab
              isClinicAdmin={isClinicAdmin}
              complianceForm={complianceForm}
              setComplianceForm={setComplianceForm}
              saving={saving}
              onSave={handleSaveCompliance}
            />
          )}

          {/* Doctors & Staff - Admin Only */}
          {!isTabPending && deferredTab === 'doctors' && (
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
          {!isTabPending && deferredTab === 'hours' && (
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
          {!isTabPending && deferredTab === 'queue' && (
            <QueueSettingsTab
              queueForm={queueForm}
              setQueueForm={setQueueForm}
              saving={saving}
              onSave={handleSaveQueue}
            />
          )}

          {/* Tax Settings */}
          {!isTabPending && deferredTab === 'tax' && (
            <TaxSettingsTab
              taxForm={taxForm}
              setTaxForm={setTaxForm}
              saving={saving}
              onSave={handleSaveTax}
            />
          )}

          {/* SMTP/Email Settings */}
          {!isTabPending && deferredTab === 'smtp' && (
            <SMTPSettingsTab
              smtpForm={smtpForm}
              setSmtpForm={setSmtpForm}
              saving={saving}
              onSave={handleSaveSmtp}
            />
          )}

          {/* Holiday Management */}
          {!isTabPending && deferredTab === 'holidays' && (
            <HolidayManagementTab
              settings={settings}
              onUpdate={fetchSettings}
              showAddForm={showHolidayAddForm}
              setShowAddForm={setShowHolidayAddForm}
            />
          )}
        </div>
      </div>
    </Layout>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsPageFallback />}>
      <SettingsPageContent />
    </Suspense>
  );
}
