'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';
import { useI18n } from '@/contexts/I18nContext';
import { SettingsTabHeader } from './SettingsTabHeader';

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
      <div className='w-full max-w-4xl space-y-6 text-left'>
        <SettingsTabHeader title={t('settings.doctors')} />
        <Card>
          <div className='p-6 text-center'>
            <h3 className='text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-1'>
              {t('settings.accessRestricted')}
            </h3>
            <p className='text-sm text-neutral-600 dark:text-neutral-400'>
              {t('settings.onlyClinicAdminDoctors')}
            </p>
          </div>
        </Card>
      </div>
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
    <div className='w-full max-w-4xl space-y-6 text-left'>
      <SettingsTabHeader title={t('settings.doctors')} />
      {showNewUserForm && (
        <Card>
          <form onSubmit={onCreateUser} className='p-5 space-y-4'>
            <h3 className='text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4'>
              {t('settings.addNewUser')}
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
              <Input
                label={t('settings.firstNameRequired')}
                value={newUserForm.firstName}
                onChange={(e) => setNewUserForm({ ...newUserForm, firstName: e.target.value })}
                required
              />
              <Input
                label={t('settings.lastNameRequired')}
                value={newUserForm.lastName}
                onChange={(e) => setNewUserForm({ ...newUserForm, lastName: e.target.value })}
                required
              />
              <Input
                label={t('settings.emailRequired')}
                type='email'
                value={newUserForm.email}
                onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                required
              />
              <div>
                <label className='block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5'>
                  {t('settings.role')} <span className='text-red-500'>*</span>
                </label>
                <select
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                  className='w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm'
                  required
                >
                  <option value='doctor'>{t('settings.roleDoctor')}</option>
                  <option value='clinic_admin'>{t('settings.roleClinicAdmin')}</option>
                  <option value='manager'>{t('settings.roleManager')}</option>
                  <option value='nurse'>{t('settings.roleNurse')}</option>
                  <option value='receptionist'>{t('settings.roleReceptionist')}</option>
                  <option value='accountant'>{t('settings.roleAccountant')}</option>
                  <option value='pharmacist'>{t('settings.rolePharmacist')}</option>
                </select>
                <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-1'>
                  {t('settings.adminManagerAccessByPlan')}
                </p>
              </div>
              <div className='md:col-span-2'>
                <div className='flex items-start gap-2'>
                  <div className='flex-1'>
                    <label className='block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5'>
                      {t('auth.password')} <span className='text-red-500'>*</span>
                    </label>
                    <Input
                      type='password'
                      value={newUserForm.password}
                      onChange={(e) => {
                        setNewUserForm({ ...newUserForm, password: e.target.value });
                        setGeneratedPassword('');
                      }}
                      placeholder={t('settings.passwordPlaceholder')}
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
                      {t('settings.generate')}
                    </Button>
                  </div>
                </div>
                {generatedPassword && (
                  <div className='mt-3 p-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700 rounded-lg'>
                    <p className='text-primary-700 dark:text-primary-300 font-semibold mb-1.5 text-xs'>
                      {t('settings.generatedPassword')}
                    </p>
                    <p className='font-mono text-primary-900 break-all mb-1.5 text-xs'>
                      {generatedPassword}
                    </p>
                    <p className='text-primary-600 text-xs'>{t('settings.userCanResetPassword')}</p>
                  </div>
                )}
              </div>
            </div>
            <div className='flex gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-600'>
              <Button type='submit' size='sm' className='flex-1'>
                {t('settings.createUser')}
              </Button>
              <Button
                type='button'
                variant='secondary'
                size='sm'
                onClick={() => setShowNewUserForm(false)}
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
          <h3 className='text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-1'>
            {t('settings.managersAndSubAccounts')}{' '}
            <span className='text-sm font-normal text-neutral-500 dark:text-neutral-400'>
              ({staffList.length})
            </span>
          </h3>
          <p className='text-sm text-neutral-600 dark:text-neutral-400 mb-4'>
            {t('settings.managersAndSubAccountsDescription')}
          </p>

          {staffList.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-10 text-neutral-400 dark:text-neutral-500'>
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
            <div className='space-y-2 mt-4'>
              {staffList.map((user) => (
                <div
                  key={user.id || user._id}
                  className='flex items-center justify-between p-3 border border-neutral-200 dark:border-neutral-600 rounded-lg hover:border-primary-300 dark:hover:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all'
                >
                  <div className='flex items-center gap-3 flex-1'>
                    <div className='w-10 h-10 bg-primary-100 dark:bg-primary-900/40 rounded-lg flex items-center justify-center text-xl'>
                      {getRoleIcon(user.role)}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <h3 className='font-semibold text-neutral-900 dark:text-neutral-100 text-sm truncate'>
                        {user.firstName} {user.lastName}
                      </h3>
                      <p className='text-xs text-neutral-600 dark:text-neutral-400 truncate'>
                        {user.email}
                      </p>
                      <div className='flex flex-wrap items-center gap-1.5 mt-1'>
                        <span className='px-1.5 py-0.5 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-xs rounded-full font-medium'>
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
                              ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                              : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
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
