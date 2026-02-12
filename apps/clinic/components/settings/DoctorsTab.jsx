'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';
import { useI18n } from '@/contexts/I18nContext';

export function DoctorsTab({
  isClinicAdmin,
  users,
  currentUserId,
  newUserForm,
  setNewUserForm,
  showNewUserForm,
  setShowNewUserForm,
  generatedPassword,
  setGeneratedPassword,
  onGeneratePassword,
  onCreateUser,
  onToggleUserStatus,
}) {
  const { t } = useI18n();

  if (!isClinicAdmin) {
    return (
      <Card className='text-center py-12'>
        <div className='flex flex-col items-center'>
          <div className='w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-3'>
            <svg
              className='w-8 h-8 text-neutral-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
              />
            </svg>
          </div>
          <h3 className='text-lg font-semibold text-neutral-900 mb-1'>
            {t('settings.accessRestricted')}
          </h3>
          <p className='text-sm text-neutral-600'>{t('settings.onlyClinicAdminDoctors')}</p>
        </div>
      </Card>
    );
  }

  const getRoleIcon = (role) => {
    const icons = {
      doctor: '👨‍⚕️',
      nurse: '👩‍⚕️',
      receptionist: '👤',
      accountant: '💼',
      pharmacist: '💊',
      clinic_admin: '👔',
      manager: '👤',
    };
    return icons[role] || '👤';
  };

  /** Only managers and sub-accounts (exclude current user); all can be activated/deactivated. */
  const staffList = (users || []).filter(
    (u) => (u.id || u._id)?.toString() !== (currentUserId ?? '')?.toString(),
  );

  return (
    <div className='space-y-3 text-left'>
      {/* Add User Form */}
      {showNewUserForm && (
        <Card>
          <form onSubmit={onCreateUser} className='p-4 space-y-3'>
            <h2 className='text-base font-bold text-neutral-900 mb-3'>
              {t('settings.addNewUser')}
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
              <Input
                label='First Name *'
                value={newUserForm.firstName}
                onChange={(e) => setNewUserForm({ ...newUserForm, firstName: e.target.value })}
                required
              />
              <Input
                label='Last Name *'
                value={newUserForm.lastName}
                onChange={(e) => setNewUserForm({ ...newUserForm, lastName: e.target.value })}
                required
              />
              <Input
                label='Email *'
                type='email'
                value={newUserForm.email}
                onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                required
              />
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
                  Role <span className='text-red-500'>*</span>
                </label>
                <select
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                  className='w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-neutral-900 text-sm'
                  required
                >
                  <option value='doctor'>Doctor</option>
                  <option value='clinic_admin'>Admin (full clinic access)</option>
                  <option value='manager'>Manager (limited clinic access)</option>
                  <option value='nurse'>Nurse</option>
                  <option value='receptionist'>Receptionist</option>
                  <option value='accountant'>Accountant</option>
                  <option value='pharmacist'>Pharmacist</option>
                </select>
                <p className='text-xs text-neutral-500 mt-1'>
                  {t('settings.adminManagerAccessByPlan')}
                </p>
              </div>
              <div className='md:col-span-2'>
                <div className='flex items-start gap-2'>
                  <div className='flex-1'>
                    <label className='block text-sm font-medium text-neutral-700 mb-1.5'>
                      Password <span className='text-red-500'>*</span>
                    </label>
                    <Input
                      type='password'
                      value={newUserForm.password}
                      onChange={(e) => {
                        setNewUserForm({ ...newUserForm, password: e.target.value });
                        setGeneratedPassword('');
                      }}
                      placeholder='Enter password or generate one'
                      required
                    />
                  </div>
                  <div className='pt-7'>
                    <Button
                      type='button'
                      variant='secondary'
                      size='sm'
                      onClick={onGeneratePassword}
                    >
                      Generate
                    </Button>
                  </div>
                </div>
                {generatedPassword && (
                  <div className='mt-3 p-3 bg-primary-50 border border-primary-200 rounded-lg'>
                    <p className='text-primary-700 font-semibold mb-1.5 text-xs'>
                      Generated Password:
                    </p>
                    <p className='font-mono text-primary-900 break-all mb-1.5 text-xs'>
                      {generatedPassword}
                    </p>
                    <p className='text-primary-600 text-xs'>User can reset this password later</p>
                  </div>
                )}
              </div>
            </div>
            <div className='flex gap-2 pt-3 border-t border-neutral-200'>
              <Button type='submit' className='flex-1'>
                Create User
              </Button>
              <Button
                type='button'
                variant='secondary'
                onClick={() => setShowNewUserForm(false)}
                className='flex-1'
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Managers and sub-accounts: list excludes current user; all can be activated/deactivated */}
      <Card>
        <div className='p-4'>
          <p className='text-sm text-neutral-600 dark:text-neutral-400 mb-3'>
            {t('settings.managersAndSubAccountsDescription')}
          </p>
          <div className='flex items-center gap-2 mb-3'>
            <div className='w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center'>
              <svg
                className='icon icon-xs text-primary-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
                />
              </svg>
            </div>
            <h2 className='text-lg font-bold text-neutral-900'>
              {t('settings.managersAndSubAccounts')}
            </h2>
            <span className='text-sm text-neutral-500'>({staffList.length})</span>
          </div>

          {staffList.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-10 text-neutral-400'>
              <svg className='w-12 h-12 mb-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
                />
              </svg>
              <p className='text-sm'>{t('settings.noManagersOrSubAccounts')}</p>
            </div>
          ) : (
            <div className='space-y-2'>
              {staffList.map((user) => (
                <div
                  key={user.id || user._id}
                  className='flex items-center justify-between p-3 border border-neutral-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all'
                >
                  <div className='flex items-center gap-3 flex-1'>
                    <div className='w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center text-xl'>
                      {getRoleIcon(user.role)}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <h3 className='font-semibold text-neutral-900 text-sm truncate'>
                        {user.firstName} {user.lastName}
                      </h3>
                      <p className='text-xs text-neutral-600 truncate'>{user.email}</p>
                      <div className='flex flex-wrap items-center gap-1.5 mt-1'>
                        <span className='px-1.5 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full font-medium'>
                          {user.role === 'doctor'
                            ? t('settings.roleDoctor')
                            : user.role === 'nurse'
                              ? t('settings.roleNurse')
                              : user.role === 'receptionist'
                                ? t('settings.roleReceptionist')
                                : user.role === 'accountant'
                                  ? t('settings.roleAccountant')
                                  : user.role === 'pharmacist'
                                    ? t('settings.rolePharmacist')
                                    : user.role === 'clinic_admin'
                                      ? t('settings.roleClinicAdmin')
                                      : user.role === 'manager'
                                        ? t('settings.roleManager')
                                        : user.role}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 text-xs rounded-full font-medium ${
                            user.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {user.isActive ? t('common.active') : t('common.inactive')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Toggle
                      checked={user.isActive || false}
                      onChange={() => onToggleUserStatus(user.id || user._id, user.isActive)}
                    />
                    <Button
                      type='button'
                      variant={user.isActive ? 'danger' : 'primary'}
                      size='sm'
                      onClick={() => onToggleUserStatus(user.id || user._id, user.isActive)}
                    >
                      {user.isActive ? t('staff.deactivate') : t('staff.activate')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
