'use client';

import { ClinicHoursTab } from '@/components/settings/ClinicHoursTab';
import { ComplianceTab } from '@/components/settings/ComplianceTab';
import { DoctorsTab } from '@/components/settings/DoctorsTab';
import { GeneralSettingsTab } from '@/components/settings/GeneralSettingsTab';
import { HolidayManagementTab } from '@/components/settings/HolidayManagementTab';
import { ProfileTab } from '@/components/settings/ProfileTab';
import { QueueSettingsTab } from '@/components/settings/QueueSettingsTab';
import { SMTPSettingsTab } from '@/components/settings/SMTPSettingsTab';
import { ConsentTemplatesTab } from '@/components/settings/ConsentTemplatesTab';
import { TaxSettingsTab } from '@/components/settings/TaxSettingsTab';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { ACTIONS, hasPermission, RESOURCES } from '@/lib/permissions/constants';
import { extractArrayData } from '@/lib/utils/api-response-extractor';
import { showError, showSuccess } from '@/lib/utils/toast';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

/** Settings tabs: clinic-related only (profile = current user; rest = clinic config). */
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
  'consent',
];
/** Must match SettingsTabs: all except profile have adminOnly: true */
const ADMIN_ONLY_TABS = [
  'general',
  'compliance',
  'doctors',
  'hours',
  'queue',
  'tax',
  'smtp',
  'holidays',
  'consent',
];

function SettingsPageFallback() {
  const { t } = useI18n();
  return (
    <div className='flex items-center justify-center min-h-[400px]'>
      <Loader type='section' text={t('common.loading')} />
    </div>
  );
}

function SettingsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const { user: currentUser, loading: authLoading, logout, refreshUser } = useAuth();
  const { t } = useI18n();
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
    logo: '',
    phone: '',
    address: { street: '', city: '', state: '', zipCode: '', country: '' },
    taxId: '',
    receiptFooter: '',
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
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({ firstName: '', lastName: '' });

  // Who can access settings (and thus admin-only tabs like Clinic info): doctor, clinic_admin
  const canAccessSettings = hasPermission(currentUser?.role, RESOURCES.SETTINGS, ACTIONS.READ);

  // Derive active tab from pathname (path-based tabs like Finance: /settings/profile, /settings/general)
  const activeTab = (() => {
    const segment = (pathname || '').replace(/^\/settings\/?/, '').split('/')[0] || 'general';
    return SETTINGS_TAB_IDS.includes(segment) ? segment : 'general';
  })();

  useEffect(() => {
    if (!authLoading && currentUser) {
      fetchSettings();
      if (currentUser.role === 'clinic_admin' || currentUser.role === 'doctor') {
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
      router.replace('/settings/profile');
    }
  }, [activeTab, currentUser, canAccessAdminTabs, router]);

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
          logo: data.settings.logo || '',
          phone: data.settings.phone || '',
          address: data.settings.address
            ? {
                street: data.settings.address.street || '',
                city: data.settings.address.city || '',
                state: data.settings.address.state || '',
                zipCode: data.settings.address.zipCode || '',
                country: data.settings.address.country || '',
              }
            : { street: '', city: '', state: '', zipCode: '', country: '' },
          taxId: data.settings.taxId || '',
          receiptFooter: data.settings.receiptFooter || '',
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
          logo: clinicForm.logo,
          phone: clinicForm.phone,
          address: clinicForm.address,
          taxId: clinicForm.taxId,
          receiptFooter: clinicForm.receiptFooter,
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

  const handleEditProfileClick = () => {
    setEditProfileForm({
      firstName: currentUser?.firstName || '',
      lastName: currentUser?.lastName || '',
    });
    setShowEditProfileModal(true);
  };

  const handleSaveEditProfile = async () => {
    const userId = currentUser?.id ?? currentUser?._id ?? currentUser?.userId;
    if (!userId) return;
    try {
      setSaving(true);
      const response = await apiClient.put(`/users/${userId}`, {
        firstName: editProfileForm.firstName?.trim() || '',
        lastName: editProfileForm.lastName?.trim() || '',
      });
      if (response?.success) {
        showSuccess(t('settings.profileUpdatedSuccess') || 'Profile updated successfully');
        setShowEditProfileModal(false);
        await refreshUser();
        fetchSettings();
      } else {
        showError(response?.error?.message || t('errors.generic') || 'Failed to update profile');
      }
    } catch (error) {
      showError(error?.message || t('errors.generic') || 'Failed to update profile');
    } finally {
      setSaving(false);
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
        await refreshUser();
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

  // Manager has no Settings access – show loader while redirect runs (redirect in useEffect above)
  if (!authLoading && currentUser && !canAccessSettings) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <Loader type='section' text={t('auth.redirectingToLogin')} />
      </div>
    );
  }

  // Doctor and Clinic Admin can access all settings tabs and add staff
  const isClinicAdmin = currentUser?.role === 'clinic_admin' || currentUser?.role === 'doctor';

  return (
    <>
      {loading ? (
        <div className='flex items-center justify-center min-h-[400px]'>
          <Loader type='section' text={t('common.loading')} />
        </div>
      ) : (
        <div className='data-tabs-container w-full'>
          <div className='tab-content-standard-width-left min-h-[200px]'>
            {/* All panels kept mounted; visibility toggled for fast tab switch (no remount). */}
            <div
              className='w-full'
              style={{ display: activeTab === 'profile' ? 'block' : 'none' }}
              aria-hidden={activeTab !== 'profile'}
              role='tabpanel'
            >
              <ProfileTab
                currentUser={currentUser}
                logout={logout}
                saving={saving}
                onToggleStatus={handleToggleMyStatus}
                availabilityForm={availabilityForm}
                setAvailabilityForm={setAvailabilityForm}
                onEditProfileClick={handleEditProfileClick}
                onAvatarUploaded={refreshUser}
              />
            </div>
            <div
              style={{ display: activeTab === 'general' ? 'block' : 'none' }}
              aria-hidden={activeTab !== 'general'}
              role='tabpanel'
            >
              <GeneralSettingsTab
                isClinicAdmin={isClinicAdmin}
                clinicForm={clinicForm}
                setClinicForm={setClinicForm}
                saving={saving}
                onSave={handleSaveGeneral}
                onCancel={fetchSettings}
              />
            </div>
            <div
              style={{ display: activeTab === 'compliance' ? 'block' : 'none' }}
              aria-hidden={activeTab !== 'compliance'}
              role='tabpanel'
            >
              <ComplianceTab
                isClinicAdmin={isClinicAdmin}
                complianceForm={complianceForm}
                setComplianceForm={setComplianceForm}
                saving={saving}
                onSave={handleSaveCompliance}
                onCancel={fetchSettings}
              />
            </div>
            <div
              style={{ display: activeTab === 'doctors' ? 'block' : 'none' }}
              aria-hidden={activeTab !== 'doctors'}
              role='tabpanel'
            >
              <DoctorsTab
                isClinicAdmin={isClinicAdmin}
                users={users}
                currentUserId={currentUser?.id ?? currentUser?.userId}
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
            </div>
            <div
              style={{ display: activeTab === 'hours' ? 'block' : 'none' }}
              aria-hidden={activeTab !== 'hours'}
              role='tabpanel'
            >
              <ClinicHoursTab
                clinicHours={clinicHours}
                updateClinicHour={updateClinicHour}
                addTimeSlot={addTimeSlot}
                removeTimeSlot={removeTimeSlot}
                updateTimeSlot={updateTimeSlot}
                saving={saving}
                onSave={handleSaveHours}
                onCancel={fetchSettings}
              />
            </div>
            <div
              style={{ display: activeTab === 'queue' ? 'block' : 'none' }}
              aria-hidden={activeTab !== 'queue'}
              role='tabpanel'
            >
              <QueueSettingsTab
                queueForm={queueForm}
                setQueueForm={setQueueForm}
                saving={saving}
                onSave={handleSaveQueue}
                onCancel={fetchSettings}
              />
            </div>
            <div
              style={{ display: activeTab === 'tax' ? 'block' : 'none' }}
              aria-hidden={activeTab !== 'tax'}
              role='tabpanel'
            >
              <TaxSettingsTab
                taxForm={taxForm}
                setTaxForm={setTaxForm}
                saving={saving}
                onSave={handleSaveTax}
                onCancel={fetchSettings}
              />
            </div>
            <div
              style={{ display: activeTab === 'smtp' ? 'block' : 'none' }}
              aria-hidden={activeTab !== 'smtp'}
              role='tabpanel'
            >
              <SMTPSettingsTab
                smtpForm={smtpForm}
                setSmtpForm={setSmtpForm}
                saving={saving}
                onSave={handleSaveSmtp}
                onCancel={fetchSettings}
              />
            </div>
            <div
              style={{ display: activeTab === 'holidays' ? 'block' : 'none' }}
              aria-hidden={activeTab !== 'holidays'}
              role='tabpanel'
            >
              <HolidayManagementTab
                settings={settings}
                onUpdate={fetchSettings}
                showAddForm={showHolidayAddForm}
                setShowAddForm={setShowHolidayAddForm}
              />
            </div>
            <div
              style={{ display: activeTab === 'consent' ? 'block' : 'none' }}
              aria-hidden={activeTab !== 'consent'}
              role='tabpanel'
            >
              <ConsentTemplatesTab />
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        title={t('settings.editProfile') || 'Edit Profile'}
        size='md'
      >
        <div className='p-4 space-y-4'>
          <div>
            <label className='block text-sm font-medium text-neutral-700 mb-2'>
              {t('auth.firstName')}
            </label>
            <Input
              value={editProfileForm.firstName}
              onChange={(e) =>
                setEditProfileForm((prev) => ({ ...prev, firstName: e.target.value }))
              }
              placeholder={t('auth.firstName')}
              aria-label={t('auth.firstName')}
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-neutral-700 mb-2'>
              {t('auth.lastName')}
            </label>
            <Input
              value={editProfileForm.lastName}
              onChange={(e) =>
                setEditProfileForm((prev) => ({ ...prev, lastName: e.target.value }))
              }
              placeholder={t('auth.lastName')}
              aria-label={t('auth.lastName')}
            />
          </div>
          <div className='flex justify-end gap-2 pt-4'>
            <Button variant='ghost' onClick={() => setShowEditProfileModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant='primary' onClick={handleSaveEditProfile} disabled={saving}>
              {saving ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export { SettingsPageContent };
