'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

export function DoctorsTab({
  isClinicAdmin,
  users,
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
  if (!isClinicAdmin) {
    return (
      <Card elevated={true}>
        <div className='text-center py-8'>
          <p className='text-neutral-600'>You don&apos;t have permission to access this section.</p>
          <p className='text-sm text-neutral-500 mt-2'>
            Only clinic administrators can manage doctors and staff.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card elevated={true}>
      <div className='mb-8'>
        <div className='flex justify-between items-start mb-6'>
          <div>
            <h2
              className='text-neutral-900 mb-2'
              style={{
                fontSize: '28px',
                lineHeight: '36px',
                letterSpacing: '-0.02em',
                fontWeight: '700',
              }}
            >
              Doctors & Staff
            </h2>
            <p
              className='text-neutral-600'
              style={{
                fontSize: '16px',
                lineHeight: '24px',
                fontWeight: '400',
              }}
            >
              Manage clinic staff members and their roles
            </p>
          </div>
          <Button
            onClick={() => setShowNewUserForm(!showNewUserForm)}
            size='md'
            className='whitespace-nowrap'
          >
            + Add User
          </Button>
        </div>
      </div>

      {showNewUserForm && (
        <form
          onSubmit={onCreateUser}
          className='mb-6 p-6 bg-neutral-50 rounded-xl border border-neutral-200 space-y-4'
        >
          <h3
            className='text-neutral-900 mb-4'
            style={{
              fontSize: '18px',
              lineHeight: '24px',
              fontWeight: '600',
            }}
          >
            Add New User
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <Input
              label='First Name'
              value={newUserForm.firstName}
              onChange={(e) => setNewUserForm({ ...newUserForm, firstName: e.target.value })}
              required
            />
            <Input
              label='Last Name'
              value={newUserForm.lastName}
              onChange={(e) => setNewUserForm({ ...newUserForm, lastName: e.target.value })}
              required
            />
            <Input
              label='Email'
              type='email'
              value={newUserForm.email}
              onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
              required
            />
            <div>
              <label
                className='block text-neutral-700 font-semibold mb-2'
                style={{ fontSize: '14px', lineHeight: '20px' }}
              >
                Password
              </label>
              <div className='flex items-start gap-3'>
                <div className='flex-1'>
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
                <Button
                  type='button'
                  variant='secondary'
                  size='md'
                  onClick={onGeneratePassword}
                  className='whitespace-nowrap'
                >
                  Generate
                </Button>
              </div>
              {generatedPassword && (
                <div className='mt-3 p-4 bg-primary-50 border border-primary-200 rounded-xl'>
                  <p
                    className='text-primary-700 font-semibold mb-2'
                    style={{ fontSize: '14px', lineHeight: '20px' }}
                  >
                    Generated Password:
                  </p>
                  <p
                    className='font-mono text-primary-900 break-all mb-2'
                    style={{ fontSize: '13px', lineHeight: '18px' }}
                  >
                    {generatedPassword}
                  </p>
                  <p className='text-primary-600' style={{ fontSize: '12px', lineHeight: '16px' }}>
                    User can reset this password later
                  </p>
                </div>
              )}
            </div>
            <div className='md:col-span-2'>
              <label
                className='block text-neutral-700 font-semibold mb-2'
                style={{ fontSize: '14px', lineHeight: '20px' }}
              >
                Role
              </label>
              <select
                value={newUserForm.role}
                onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                className='w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-neutral-900'
                style={{ fontSize: '14px', lineHeight: '20px' }}
              >
                <option value='doctor'>Doctor</option>
                <option value='nurse'>Nurse</option>
                <option value='receptionist'>Receptionist</option>
                <option value='accountant'>Accountant</option>
                <option value='pharmacist'>Pharmacist</option>
                <option value='clinic_admin'>Clinic Admin</option>
              </select>
            </div>
          </div>
          <div className='flex gap-2'>
            <Button type='submit' size='md' className='whitespace-nowrap'>
              Create User
            </Button>
            <Button
              type='button'
              variant='secondary'
              size='md'
              onClick={() => setShowNewUserForm(false)}
              className='whitespace-nowrap'
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      <div className='overflow-x-auto rounded-xl border border-neutral-200'>
        <table className='min-w-full divide-y divide-neutral-200'>
          <thead className='bg-neutral-50'>
            <tr>
              <th
                className='text-left font-semibold text-neutral-700 uppercase tracking-wider'
                style={{
                  fontSize: '12px',
                  lineHeight: '16px',
                  paddingLeft: 'var(--space-6)',
                  paddingRight: 'var(--space-6)',
                  paddingTop: 'var(--space-4)',
                  paddingBottom: 'var(--space-4)',
                }}
              >
                Name
              </th>
              <th
                className='text-left font-semibold text-neutral-700 uppercase tracking-wider'
                style={{
                  fontSize: '12px',
                  lineHeight: '16px',
                  paddingLeft: 'var(--space-6)',
                  paddingRight: 'var(--space-6)',
                  paddingTop: 'var(--space-4)',
                  paddingBottom: 'var(--space-4)',
                }}
              >
                Email
              </th>
              <th
                className='text-left font-semibold text-neutral-700 uppercase tracking-wider'
                style={{
                  fontSize: '12px',
                  lineHeight: '16px',
                  paddingLeft: 'var(--space-6)',
                  paddingRight: 'var(--space-6)',
                  paddingTop: 'var(--space-4)',
                  paddingBottom: 'var(--space-4)',
                }}
              >
                Role
              </th>
              <th
                className='text-left font-semibold text-neutral-700 uppercase tracking-wider'
                style={{
                  fontSize: '12px',
                  lineHeight: '16px',
                  paddingLeft: 'var(--space-6)',
                  paddingRight: 'var(--space-6)',
                  paddingTop: 'var(--space-4)',
                  paddingBottom: 'var(--space-4)',
                }}
              >
                Status
              </th>
              <th
                className='text-left font-semibold text-neutral-700 uppercase tracking-wider'
                style={{
                  fontSize: '12px',
                  lineHeight: '16px',
                  paddingLeft: 'var(--space-6)',
                  paddingRight: 'var(--space-6)',
                  paddingTop: 'var(--space-4)',
                  paddingBottom: 'var(--space-4)',
                }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className='bg-white divide-y divide-neutral-200'>
            {users.map((user) => (
              <tr key={user.id} className='hover:bg-neutral-50'>
                <td
                  className='px-6 py-4 whitespace-nowrap text-neutral-900 font-medium'
                  style={{ fontSize: '14px', lineHeight: '20px' }}
                >
                  {user.firstName} {user.lastName}
                </td>
                <td
                  className='px-6 py-4 whitespace-nowrap text-neutral-600'
                  style={{ fontSize: '14px', lineHeight: '20px' }}
                >
                  {user.email}
                </td>
                <td
                  className='whitespace-nowrap'
                  style={{
                    paddingLeft: 'var(--space-6)',
                    paddingRight: 'var(--space-6)',
                    paddingTop: 'var(--space-4)',
                    paddingBottom: 'var(--space-4)',
                  }}
                >
                  <span
                    className='inline-flex items-center rounded-full font-semibold'
                    style={{
                      fontSize: '12px',
                      lineHeight: '16px',
                      backgroundColor: 'var(--color-primary-100)',
                      color: 'var(--color-primary-700)',
                      paddingLeft: 'var(--space-3)',
                      paddingRight: 'var(--space-3)',
                      paddingTop: 'var(--space-1)',
                      paddingBottom: 'var(--space-1)',
                    }}
                  >
                    {user.role === 'doctor'
                      ? 'Doctor'
                      : user.role === 'nurse'
                      ? 'Nurse'
                      : user.role === 'receptionist'
                      ? 'Receptionist'
                      : user.role === 'accountant'
                      ? 'Accountant'
                      : user.role === 'pharmacist'
                      ? 'Pharmacist'
                      : user.role === 'clinic_admin'
                      ? 'Clinic Admin'
                      : user.role}
                  </span>
                </td>
                <td
                  className='whitespace-nowrap'
                  style={{
                    paddingLeft: 'var(--space-6)',
                    paddingRight: 'var(--space-6)',
                    paddingTop: 'var(--space-4)',
                    paddingBottom: 'var(--space-4)',
                  }}
                >
                  <span
                    className={`inline-flex items-center rounded-full font-semibold ${
                      user.isActive
                        ? 'bg-secondary-100 text-secondary-700'
                        : 'bg-status-error/20 text-status-error'
                    }`}
                    style={{
                      fontSize: '12px',
                      lineHeight: '16px',
                      paddingLeft: 'var(--space-3)',
                      paddingRight: 'var(--space-3)',
                      paddingTop: 'var(--space-1)',
                      paddingBottom: 'var(--space-1)',
                    }}
                  >
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td
                  className='whitespace-nowrap'
                  style={{
                    paddingLeft: 'var(--space-6)',
                    paddingRight: 'var(--space-6)',
                    paddingTop: 'var(--space-4)',
                    paddingBottom: 'var(--space-4)',
                  }}
                >
                  <Button
                    type='button'
                    variant={user.isActive ? 'danger' : 'primary'}
                    size='sm'
                    onClick={() => onToggleUserStatus(user.id, user.isActive)}
                    className='whitespace-nowrap'
                  >
                    {user.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div
            className='text-center py-12 text-neutral-600'
            style={{ fontSize: '14px', lineHeight: '20px' }}
          >
            No users found
          </div>
        )}
      </div>
    </Card>
  );
}
