'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { apiClient } from '@/lib/api/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function PatientProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [patient, setPatient] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    bloodGroup: '',
    emergencyContact: '',
  });
  const [activeTab, setActiveTab] = useState('profile'); // profile, password, notifications, privacy
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [notificationPrefs, setNotificationPrefs] = useState({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    appointmentReminders: true,
    prescriptionAlerts: true,
    labResultAlerts: true,
    marketingEmails: false,
  });
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'private',
    shareMedicalRecords: false,
    allowDoctorAccess: true,
    dataSharing: false,
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/auth/me');
      if (response.success && response.data) {
        setPatient(response.data);
        setFormData({
          firstName: response.data.firstName || '',
          lastName: response.data.lastName || '',
          dateOfBirth: response.data.dateOfBirth
            ? new Date(response.data.dateOfBirth).toISOString().split('T')[0]
            : '',
          gender: response.data.gender || '',
          phone: response.data.phone || '',
          email: response.data.email || '',
          address: response.data.address || '',
          bloodGroup: response.data.bloodGroup || '',
          emergencyContact: response.data.emergencyContact || '',
        });
        
        // Fetch notification preferences
        try {
          const notifResponse = await apiClient.get('/patients/me/notification-preferences');
          if (notifResponse.success) {
            setNotificationPrefs(notifResponse.data || notificationPrefs);
          }
        } catch (err) {
          // Use defaults
        }
        
        // Fetch privacy settings
        try {
          const privacyResponse = await apiClient.get('/patients/me/privacy-settings');
          if (privacyResponse.success) {
            setPrivacySettings(privacyResponse.data || privacySettings);
          }
        } catch (err) {
          // Use defaults
        }
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await apiClient.put('/patients/me', formData);
      if (response.success) {
        alert('Profile updated successfully');
        fetchProfile();
      } else {
        alert('Failed to update profile');
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      alert('Password must be at least 8 characters long');
      return;
    }
    try {
      setSaving(true);
      const response = await apiClient.post('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      if (response.success) {
        alert('Password changed successfully');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        alert(response.error?.message || 'Failed to change password');
      }
    } catch (err) {
      alert('Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      setSaving(true);
      const response = await apiClient.put('/patients/me/notification-preferences', notificationPrefs);
      if (response.success) {
        alert('Notification preferences saved');
      } else {
        alert('Failed to save notification preferences');
      }
    } catch (err) {
      alert('Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePrivacy = async () => {
    try {
      setSaving(true);
      const response = await apiClient.put('/patients/me/privacy-settings', privacySettings);
      if (response.success) {
        alert('Privacy settings saved');
      } else {
        alert('Failed to save privacy settings');
      }
    } catch (err) {
      alert('Failed to save privacy settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }
    try {
      setSaving(true);
      const response = await apiClient.delete('/patients/me');
      if (response.success) {
        alert('Account deleted successfully');
        router.push('/patient-portal');
      } else {
        alert('Failed to delete account');
      }
    } catch (err) {
      alert('Failed to delete account');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-neutral-50 flex items-center justify-center'>
        <Loader size='lg' />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-neutral-50'>
      {/* Header */}
      <header className='bg-white shadow-sm border-b border-neutral-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
          <div className='flex items-center justify-between'>
            <Link href='/patient-portal/dashboard' className='flex items-center gap-2'>
              <div className='w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center'>
                <span className='text-white font-bold text-xl'>C</span>
              </div>
              <span className='text-xl font-bold text-neutral-900'>ClinicTool</span>
            </Link>
          </div>
        </div>
      </header>

      <div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <h1 className='text-3xl font-bold text-neutral-900 mb-6'>Profile Settings</h1>

        {/* Tabs */}
        <div className='flex gap-2 mb-6 border-b border-neutral-200'>
          {[
            { id: 'profile', label: 'Personal Details', icon: '👤' },
            { id: 'password', label: 'Change Password', icon: '🔒' },
            { id: 'notifications', label: 'Notifications', icon: '🔔' },
            { id: 'privacy', label: 'Privacy', icon: '🛡️' },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`px-4 py-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
        <Card className='p-6'>
          <div className='space-y-6'>
            {/* Profile Photo */}
            <div className='text-center'>
              <div className='w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <span className='text-4xl font-bold text-primary-600'>
                  {formData.firstName?.charAt(0) || 'P'}
                </span>
              </div>
              <Button variant='secondary' size='sm'>
                Change Photo
              </Button>
            </div>

            {/* Personal Information */}
            <div>
              <h2 className='text-lg font-bold text-neutral-900 mb-4'>Personal Information</h2>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    First Name *
                  </label>
                  <Input
                    type='text'
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    Last Name *
                  </label>
                  <Input
                    type='text'
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    Date of Birth
                  </label>
                  <Input
                    type='date'
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>Gender</label>
                  <select
                    className='w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                    value={formData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                  >
                    <option value=''>Select</option>
                    <option value='male'>Male</option>
                    <option value='female'>Female</option>
                    <option value='other'>Other</option>
                  </select>
                </div>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    Blood Group
                  </label>
                  <select
                    className='w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                    value={formData.bloodGroup}
                    onChange={(e) => handleInputChange('bloodGroup', e.target.value)}
                  >
                    <option value=''>Select</option>
                    <option value='A+'>A+</option>
                    <option value='A-'>A-</option>
                    <option value='B+'>B+</option>
                    <option value='B-'>B-</option>
                    <option value='AB+'>AB+</option>
                    <option value='AB-'>AB-</option>
                    <option value='O+'>O+</option>
                    <option value='O-'>O-</option>
                  </select>
                </div>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    Emergency Contact
                  </label>
                  <Input
                    type='tel'
                    value={formData.emergencyContact}
                    onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                    placeholder='Phone number'
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h2 className='text-lg font-bold text-neutral-900 mb-4'>Contact Information</h2>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    Phone Number *
                  </label>
                  <Input
                    type='tel'
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>Email</label>
                  <Input
                    type='email'
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>
                <div className='md:col-span-2'>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>Address</label>
                  <textarea
                    className='w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                    rows={3}
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className='flex justify-end gap-4 pt-4 border-t border-neutral-200'>
              <Link href='/patient-portal/dashboard'>
                <Button variant='secondary'>Cancel</Button>
              </Link>
              <Button variant='primary' onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </Card>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <Card className='p-6'>
            <h2 className='text-xl font-bold text-neutral-900 mb-6'>Change Password</h2>
            <div className='space-y-4 max-w-md'>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  Current Password *
                </label>
                <Input
                  type='password'
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  New Password *
                </label>
                <Input
                  type='password'
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  required
                  minLength={8}
                />
                <p className='text-xs text-neutral-500 mt-1'>Must be at least 8 characters</p>
              </div>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  Confirm New Password *
                </label>
                <Input
                  type='password'
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  required
                />
                {passwordData.newPassword && passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                  <p className='text-xs text-red-600 mt-1'>Passwords do not match</p>
                )}
              </div>
              <Button variant='primary' onClick={handleChangePassword} disabled={saving}>
                {saving ? 'Changing...' : 'Change Password'}
              </Button>
            </div>
          </Card>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <Card className='p-6'>
            <h2 className='text-xl font-bold text-neutral-900 mb-6'>Notification Preferences</h2>
            <div className='space-y-4'>
              {[
                { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive notifications via email' },
                { key: 'smsNotifications', label: 'SMS Notifications', description: 'Receive notifications via SMS' },
                { key: 'pushNotifications', label: 'Push Notifications', description: 'Receive browser push notifications' },
                { key: 'appointmentReminders', label: 'Appointment Reminders', description: 'Get reminders before appointments' },
                { key: 'prescriptionAlerts', label: 'Prescription Alerts', description: 'Notifications for new prescriptions' },
                { key: 'labResultAlerts', label: 'Lab Result Alerts', description: 'Notifications when lab results are available' },
                { key: 'marketingEmails', label: 'Marketing Emails', description: 'Receive promotional and health tips emails' },
              ].map((pref) => (
                <div key={pref.key} className='flex items-center justify-between p-4 border border-neutral-200 rounded-lg'>
                  <div>
                    <p className='font-semibold text-neutral-900'>{pref.label}</p>
                    <p className='text-sm text-neutral-600'>{pref.description}</p>
                  </div>
                  <label className='relative inline-flex items-center cursor-pointer'>
                    <input
                      type='checkbox'
                      checked={notificationPrefs[pref.key]}
                      onChange={(e) => setNotificationPrefs({ ...notificationPrefs, [pref.key]: e.target.checked })}
                      className='sr-only peer'
                    />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              ))}
              <div className='pt-4 border-t border-neutral-200'>
                <Button variant='primary' onClick={handleSaveNotifications} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Preferences'}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Privacy Tab */}
        {activeTab === 'privacy' && (
          <Card className='p-6'>
            <h2 className='text-xl font-bold text-neutral-900 mb-6'>Privacy Settings</h2>
            <div className='space-y-6'>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  Profile Visibility
                </label>
                <select
                  className='w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                  value={privacySettings.profileVisibility}
                  onChange={(e) => setPrivacySettings({ ...privacySettings, profileVisibility: e.target.value })}
                >
                  <option value='private'>Private - Only you can see</option>
                  <option value='doctors'>Doctors Only - Visible to verified doctors</option>
                  <option value='public'>Public - Visible to all users</option>
                </select>
              </div>
              
              {[
                { key: 'shareMedicalRecords', label: 'Share Medical Records with Doctors', description: 'Allow doctors to access your medical history' },
                { key: 'allowDoctorAccess', label: 'Allow Doctor Access', description: 'Doctors can view your complete profile' },
                { key: 'dataSharing', label: 'Data Sharing for Research', description: 'Allow anonymized data to be used for medical research' },
              ].map((setting) => (
                <div key={setting.key} className='flex items-center justify-between p-4 border border-neutral-200 rounded-lg'>
                  <div>
                    <p className='font-semibold text-neutral-900'>{setting.label}</p>
                    <p className='text-sm text-neutral-600'>{setting.description}</p>
                  </div>
                  <label className='relative inline-flex items-center cursor-pointer'>
                    <input
                      type='checkbox'
                      checked={privacySettings[setting.key]}
                      onChange={(e) => setPrivacySettings({ ...privacySettings, [setting.key]: e.target.checked })}
                      className='sr-only peer'
                    />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              ))}
              
              <div className='pt-4 border-t border-neutral-200'>
                <Button variant='primary' onClick={handleSavePrivacy} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Privacy Settings'}
                </Button>
              </div>

              {/* Delete Account */}
              <div className='pt-6 border-t-2 border-red-200'>
                <h3 className='text-lg font-bold text-red-900 mb-2'>Danger Zone</h3>
                <p className='text-sm text-neutral-600 mb-4'>
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                {!showDeleteConfirm ? (
                  <Button
                    variant='outline'
                    onClick={() => setShowDeleteConfirm(true)}
                    className='border-red-300 text-red-700 hover:bg-red-50'
                  >
                    Delete Account
                  </Button>
                ) : (
                  <div className='p-4 bg-red-50 border border-red-200 rounded-lg'>
                    <p className='text-sm text-red-800 mb-4'>
                      Are you absolutely sure? This will permanently delete your account and all associated data.
                    </p>
                    <div className='flex items-center gap-3'>
                      <Button
                        variant='primary'
                        onClick={handleDeleteAccount}
                        disabled={saving}
                        className='bg-red-600 hover:bg-red-700'
                      >
                        {saving ? 'Deleting...' : 'Yes, Delete My Account'}
                      </Button>
                      <Button variant='secondary' onClick={() => setShowDeleteConfirm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
