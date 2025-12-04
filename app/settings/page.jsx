'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function SettingsPage() {
  const { user: currentUser, loading: authLoading } = useAuth();
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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [clinicForm, setClinicForm] = useState({
    name: '',
    region: 'US',
    currency: 'USD',
    locale: 'en-US',
    timezone: 'America/New_York',
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
      if (currentUser.role !== 'clinic_admin' && ['general', 'compliance', 'doctors'].includes(activeTab)) {
        setActiveTab('profile');
      }
    }
  }, [authLoading, currentUser]);

  // Separate effect to handle tab changes and access control
  useEffect(() => {
    if (currentUser && currentUser.role !== 'clinic_admin' && ['general', 'compliance', 'doctors'].includes(activeTab)) {
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
        // Load clinic hours with backward compatibility
        if (data.settings.clinicHours && Array.isArray(data.settings.clinicHours) && data.settings.clinicHours.length > 0) {
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
          const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
          const loadedDays = hours.map((h) => h.day);
          const missingDays = daysOfWeek.filter(day => !loadedDays.includes(day));
          const completeHours = [...hours];
          missingDays.forEach(day => {
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
      setError('Failed to load settings');
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
    setError('');
    setSuccess('');
    try {
      const response = await apiClient.put('/settings', {
        name: clinicForm.name,
        region: clinicForm.region,
        settings: {
          currency: clinicForm.currency,
          locale: clinicForm.locale,
          timezone: clinicForm.timezone,
        },
      });
      if (response.success) {
        setSuccess('Clinic settings saved successfully');
        fetchSettings();
      } else {
        setError(response.error?.message || 'Failed to save settings');
      }
    } catch (error) {
      setError(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCompliance = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
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
        setSuccess('Compliance settings saved successfully');
        fetchSettings();
      } else {
        setError(response.error?.message || 'Failed to save settings');
      }
    } catch (error) {
      setError(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveQueue = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await apiClient.put('/settings', {
        settings: {
          queueSettings: queueForm,
        },
      });
      if (response.success) {
        setSuccess('Queue settings saved successfully');
        fetchSettings();
      } else {
        setError(response.error?.message || 'Failed to save settings');
      }
    } catch (error) {
      setError(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTax = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await apiClient.put('/settings', {
        settings: {
          taxRules: taxForm,
        },
      });
      if (response.success) {
        setSuccess('Tax settings saved successfully');
        fetchSettings();
      } else {
        setError(response.error?.message || 'Failed to save settings');
      }
    } catch (error) {
      setError(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveHours = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      // Validate clinicHours data before sending
      const validHours = clinicHours.map(hour => ({
        day: hour.day,
        isOpen: hour.isOpen,
        timeSlots: hour.timeSlots.filter(slot => slot.startTime && slot.endTime),
      }));

      console.log('Saving clinic hours:', JSON.stringify(validHours, null, 2));

      const response = await apiClient.put('/settings', {
        settings: {
          clinicHours: validHours,
        },
      }, {}, true); // skipRedirect = true to prevent automatic logout
      
      if (response.success) {
        setSuccess('Clinic hours saved successfully');
        // Don't refetch immediately to avoid race conditions
        setTimeout(() => {
          fetchSettings();
        }, 500);
      } else {
        const errorMessage = response.error?.message || 'Failed to save settings';
        setError(errorMessage);
        console.error('Failed to save clinic hours:', response.error);
        
        // If it's an auth error, show a more helpful message
        if (response.error?.code === 'UNAUTHORIZED' || response.error?.code === 'FORBIDDEN') {
          setError('Your session may have expired. Please try refreshing the page.');
        }
      }
    } catch (error) {
      console.error('Error saving clinic hours:', error);
      setError(error.message || 'Failed to save settings. Please try again.');
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
    setError('');
    setSuccess('');
    try {
      console.log('Creating user with data:', { ...newUserForm, password: '***' });
      const response = await apiClient.post('/users', newUserForm);
      if (response.success) {
        setSuccess('User created successfully');
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
        const errorDetails = response.error?.details ? JSON.stringify(response.error.details, null, 2) : '';
        setError(errorDetails ? `${errorMessage}\n\nDetails:\n${errorDetails}` : errorMessage);
        console.error('Failed to create user:', response.error);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setError(error.message || 'Failed to create user');
    }
  };

  const handleToggleUserStatus = async (userId, isActive) => {
    try {
      const response = await apiClient.put(`/users/${userId}`, { isActive: !isActive });
      if (response.success) {
        fetchUsers();
        setSuccess(`User ${!isActive ? 'activated' : 'deactivated'} successfully`);
      }
    } catch (error) {
      setError(error.message || 'Failed to update user');
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </Layout>
    );
  }

  // Icon components for tabs
  const ProfileIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
  
  const ClinicIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
  
  const ComplianceIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
  
  const DoctorsIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
  
  const HoursIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
  
  const QueueIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
  
  const TaxIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  // Define all tabs
  const allTabs = [
    { id: 'profile', label: t('settings.profile'), icon: <ProfileIcon />, adminOnly: false },
    { id: 'general', label: t('settings.clinicInfo'), icon: <ClinicIcon />, adminOnly: true },
    { id: 'compliance', label: t('settings.compliance'), icon: <ComplianceIcon />, adminOnly: true },
    { id: 'doctors', label: t('settings.doctorsStaff'), icon: <DoctorsIcon />, adminOnly: true },
    { id: 'hours', label: t('settings.clinicHours'), icon: <HoursIcon />, adminOnly: false },
    { id: 'queue', label: t('settings.queueSettings'), icon: <QueueIcon />, adminOnly: false },
    { id: 'tax', label: t('settings.taxSettings'), icon: <TaxIcon />, adminOnly: false },
  ];

  // Filter tabs based on user role
  const isClinicAdmin = currentUser?.role === 'clinic_admin';
  const tabs = allTabs.filter(tab => !tab.adminOnly || isClinicAdmin);

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('settings.title')}</h1>
        <p className="text-gray-600 mt-2">{t('settings.description')}</p>
      </div>

      {(error || success) && (
        <div className={`mb-6 p-4 rounded-lg ${
          error ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'
        }`}>
          {error || success}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2 flex items-center">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Profile Settings */}
      {activeTab === 'profile' && (
        <Card>
          <h2 className="text-xl font-semibold mb-6">{t('settings.profile')}</h2>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.firstName')}
                </label>
                <Input
                  value={currentUser?.firstName || ''}
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.lastName')}
                </label>
                <Input
                  value={currentUser?.lastName || ''}
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.email')}
                </label>
                <Input
                  value={currentUser?.email || ''}
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <Input
                  value={currentUser?.role || ''}
                  disabled
                />
              </div>
            </div>

            <div className="pt-6 border-t">
              <h3 className="text-lg font-medium mb-4">Change Password</h3>
              <div className="space-y-4 max-w-md">
                <Input
                  label="Current Password"
                  type="password"
                  placeholder="Enter current password"
                />
                <Input
                  label="New Password"
                  type="password"
                  placeholder="Enter new password"
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  placeholder="Confirm new password"
                />
                <Button>Update Password</Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* General Settings - Admin Only */}
      {activeTab === 'general' && (
        <>
          {!isClinicAdmin ? (
            <Card>
              <div className="text-center py-8">
                <p className="text-gray-500">You don&apos;t have permission to access this section.</p>
                <p className="text-sm text-gray-400 mt-2">Only clinic administrators can manage clinic information.</p>
              </div>
            </Card>
          ) : (
            <Card>
              <h2 className="text-xl font-semibold mb-6">{t('settings.clinicSettings')}</h2>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('settings.clinicName')} *
                </label>
                <Input
                  value={clinicForm.name}
                  onChange={(e) => setClinicForm({ ...clinicForm, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('settings.region')} *
                </label>
                <select
                  value={clinicForm.region}
                  onChange={(e) => setClinicForm({ ...clinicForm, region: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="US">United States</option>
                  <option value="EU">European Union</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>
                  <option value="IN">India</option>
                  <option value="APAC">Asia Pacific</option>
                  <option value="ME">Middle East</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('settings.currency')} *
                </label>
                <select
                  value={clinicForm.currency}
                  onChange={(e) => setClinicForm({ ...clinicForm, currency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="INR">INR - Indian Rupee</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="AUD">AUD - Australian Dollar</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('settings.locale')} *
                </label>
                <select
                  value={clinicForm.locale}
                  onChange={(e) => setClinicForm({ ...clinicForm, locale: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="en-US">English (US)</option>
                  <option value="en-GB">English (UK)</option>
                  <option value="en-CA">English (Canada)</option>
                  <option value="en-AU">English (Australia)</option>
                  <option value="fr-CA">French (Canada)</option>
                  <option value="es-ES">Spanish (Spain)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('settings.timezone')} *
                </label>
                <select
                  value={clinicForm.timezone}
                  onChange={(e) => setClinicForm({ ...clinicForm, timezone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="America/Toronto">Toronto</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Paris">Paris</option>
                  <option value="Asia/Kolkata">India</option>
                  <option value="Australia/Sydney">Sydney</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveGeneral} isLoading={saving}>
                {t('common.save')}
              </Button>
            </div>
          </div>
        </Card>
          )}
        </>
      )}

      {/* Compliance Settings - Admin Only */}
      {activeTab === 'compliance' && (
        <>
          {!isClinicAdmin ? (
            <Card>
              <div className="text-center py-8">
                <p className="text-gray-500">You don&apos;t have permission to access this section.</p>
                <p className="text-sm text-gray-400 mt-2">Only clinic administrators can manage compliance settings.</p>
              </div>
            </Card>
          ) : (
            <Card>
              <h2 className="text-xl font-semibold mb-6">Compliance & Data Protection</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Compliance Standards</h3>
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={complianceForm.hipaa}
                    onChange={(e) => setComplianceForm({ ...complianceForm, hipaa: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-700">HIPAA Compliance (US)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={complianceForm.gdpr}
                    onChange={(e) => setComplianceForm({ ...complianceForm, gdpr: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-700">GDPR Compliance (EU)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={complianceForm.pipeda}
                    onChange={(e) => setComplianceForm({ ...complianceForm, pipeda: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-700">PIPEDA Compliance (Canada)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={complianceForm.privacyAct}
                    onChange={(e) => setComplianceForm({ ...complianceForm, privacyAct: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-700">Privacy Act Compliance (Australia)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Retention Period (Years)
              </label>
              <Input
                type="number"
                min="1"
                max="30"
                value={complianceForm.dataRetentionYears}
                onChange={(e) => setComplianceForm({ ...complianceForm, dataRetentionYears: parseInt(e.target.value) || 7 })}
              />
              <p className="text-sm text-gray-500 mt-1">
                How long to retain patient data (varies by region)
              </p>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveCompliance} isLoading={saving}>
                Save Changes
              </Button>
            </div>
          </div>
        </Card>
          )}
        </>
      )}

      {/* Doctors & Staff - Admin Only */}
      {activeTab === 'doctors' && (
        <>
          {!isClinicAdmin ? (
            <Card>
              <div className="text-center py-8">
                <p className="text-gray-500">You don&apos;t have permission to access this section.</p>
                <p className="text-sm text-gray-400 mt-2">Only clinic administrators can manage doctors and staff.</p>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Doctors & Staff</h2>
            <Button onClick={() => setShowNewUserForm(!showNewUserForm)}>
              + Add User
            </Button>
          </div>

          {showNewUserForm && (
            <form onSubmit={handleCreateUser} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
              <h3 className="font-medium">Add New User</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  value={newUserForm.firstName}
                  onChange={(e) => setNewUserForm({ ...newUserForm, firstName: e.target.value })}
                  required
                />
                <Input
                  label="Last Name"
                  value={newUserForm.lastName}
                  onChange={(e) => setNewUserForm({ ...newUserForm, lastName: e.target.value })}
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  required
                />
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Input
                      label="Password"
                      type="password"
                      value={newUserForm.password}
                      onChange={(e) => {
                        setNewUserForm({ ...newUserForm, password: e.target.value });
                        setGeneratedPassword('');
                      }}
                      required
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={generatePassword}
                      className="mt-6"
                    >
                      Generate
                    </Button>
                  </div>
                  {generatedPassword && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-700 font-medium mb-1">Generated Password:</p>
                      <p className="text-sm font-mono text-blue-900 break-all">{generatedPassword}</p>
                      <p className="text-xs text-blue-600 mt-1">User can reset this password later</p>
                    </div>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="doctor">Doctor</option>
                    <option value="nurse">Nurse</option>
                    <option value="receptionist">Receptionist</option>
                    <option value="accountant">Accountant</option>
                    <option value="pharmacist">Pharmacist</option>
                    <option value="clinic_admin">Clinic Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Create User</Button>
                <Button type="button" variant="outline" onClick={() => setShowNewUserForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                        className={`text-${user.isActive ? 'red' : 'green'}-600 hover:text-${user.isActive ? 'red' : 'green'}-900`}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="text-center py-8 text-gray-500">No users found</div>
            )}
          </div>
        </Card>
          )}
        </>
      )}

      {/* Clinic Hours */}
      {activeTab === 'hours' && (
        <Card>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Clinic Operating Hours</h2>
            <Button onClick={handleSaveHours} isLoading={saving}>
              Save Changes
            </Button>
          </div>
          <div className="space-y-4">
            {clinicHours.map((hour, dayIndex) => (
              <div key={hour.day} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-24">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={hour.isOpen}
                        onChange={(e) => updateClinicHour(dayIndex, 'isOpen', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 font-medium">{hour.day}</span>
                    </label>
                  </div>
                  {hour.isOpen && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => addTimeSlot(dayIndex)}
                      className="text-sm"
                    >
                      + Add Time Slot
                    </Button>
                  )}
                </div>
                {hour.isOpen && (
                  <div className="space-y-3 ml-28">
                    {hour.timeSlots.map((slot, slotIndex) => (
                      <div key={slotIndex} className="flex gap-4 p-3 bg-gray-50 rounded-lg">
                        <div className="w-40">
                          <label className="block text-sm text-gray-600 mb-1">Start Time</label>
                          <Input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => updateTimeSlot(dayIndex, slotIndex, 'startTime', e.target.value)}
                            className="w-full"
                          />
                        </div>
                        <div className="w-40">
                          <label className="block text-sm text-gray-600 mb-1">End Time</label>
                          <Input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => updateTimeSlot(dayIndex, slotIndex, 'endTime', e.target.value)}
                            className="w-full"
                          />
                        </div>
                        {hour.timeSlots.length > 1 && (
                          <div className="flex items-end">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeTimeSlot(dayIndex, slotIndex)}
                              className="text-red-600 hover:text-red-700 hover:border-red-300"
                            >
                              Remove
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {!hour.isOpen && (
                  <div className="ml-28 text-gray-500">Closed</div>
                )}
              </div>
            ))}
            <div className="flex justify-end mt-6">
              <Button onClick={handleSaveHours} isLoading={saving}>
                Save Changes
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Queue Settings */}
      {activeTab === 'queue' && (
        <Card>
          <h2 className="text-xl font-semibold mb-6">Queue Management Settings</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Order
              </label>
              <select
                value={queueForm.displayOrder}
                onChange={(e) => setQueueForm({ ...queueForm, displayOrder: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="priority">By Priority</option>
                <option value="fifo">First In First Out</option>
                <option value="appointment_time">By Appointment Time</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Average Consultation Time (minutes)
              </label>
              <Input
                type="number"
                min="5"
                max="120"
                value={queueForm.averageConsultationTime}
                onChange={(e) => setQueueForm({ ...queueForm, averageConsultationTime: parseInt(e.target.value) || 30 })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Queue Length per Doctor
              </label>
              <Input
                type="number"
                min="1"
                value={queueForm.maxQueueLength}
                onChange={(e) => setQueueForm({ ...queueForm, maxQueueLength: parseInt(e.target.value) || 50 })}
              />
            </div>

            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={queueForm.enablePublicDisplay}
                  onChange={(e) => setQueueForm({ ...queueForm, enablePublicDisplay: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-gray-700">Enable Public Queue Display (No PHI)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={queueForm.showEstimatedWaitTime}
                  onChange={(e) => setQueueForm({ ...queueForm, showEstimatedWaitTime: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-gray-700">Show Estimated Wait Time</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={queueForm.autoCallNext}
                  onChange={(e) => setQueueForm({ ...queueForm, autoCallNext: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-gray-700">Automatically Call Next Patient</span>
              </label>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveQueue} isLoading={saving}>
                Save Changes
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Tax Settings */}
      {activeTab === 'tax' && (
        <Card>
          <h2 className="text-xl font-semibold mb-6">Tax Configuration</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country
              </label>
              <Input
                value={taxForm.country}
                onChange={(e) => setTaxForm({ ...taxForm, country: e.target.value })}
                placeholder="e.g., United States"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax Type
              </label>
              <select
                value={taxForm.taxType}
                onChange={(e) => setTaxForm({ ...taxForm, taxType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="SALES_TAX">Sales Tax</option>
                <option value="GST">GST (Goods and Services Tax)</option>
                <option value="VAT">VAT (Value Added Tax)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax Rate (%)
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={taxForm.rate}
                onChange={(e) => setTaxForm({ ...taxForm, rate: parseFloat(e.target.value) || 0 })}
                placeholder="e.g., 8.5"
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveTax} isLoading={saving}>
                Save Changes
              </Button>
            </div>
          </div>
        </Card>
      )}
    </Layout>
  );
}

