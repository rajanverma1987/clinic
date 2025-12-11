'use client';

import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { Tabs } from '@/components/ui/Tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PatientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [labTests, setLabTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && user && params.id) {
      fetchAllData();
    }
  }, [authLoading, user, params.id]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch patient
      const patientResponse = await apiClient.get(`/patients/${params.id}`);
      if (patientResponse.success && patientResponse.data) {
        setPatient(patientResponse.data);
        setFormData(patientResponse.data);
      }

      // Fetch appointments
      try {
        const aptResponse = await apiClient.get(`/appointments?patientId=${params.id}&limit=100`);
        if (aptResponse.success && aptResponse.data) {
          const aptData = Array.isArray(aptResponse.data)
            ? aptResponse.data
            : aptResponse.data.data || [];
          setAppointments(aptData);
        }
      } catch (err) {
        console.error('Failed to fetch appointments:', err);
      }

      // Fetch prescriptions
      try {
        const presResponse = await apiClient.get(`/prescriptions?patientId=${params.id}&limit=100`);
        if (presResponse.success && presResponse.data) {
          const presData = Array.isArray(presResponse.data)
            ? presResponse.data
            : presResponse.data.data || [];
          setPrescriptions(presData);
        }
      } catch (err) {
        console.error('Failed to fetch prescriptions:', err);
      }

      // Fetch invoices
      try {
        const invResponse = await apiClient.get(`/invoices?patientId=${params.id}&limit=100`);
        if (invResponse.success && invResponse.data) {
          const invData = Array.isArray(invResponse.data)
            ? invResponse.data
            : invResponse.data.data || [];
          setInvoices(invData);
        }
      } catch (err) {
        console.error('Failed to fetch invoices:', err);
      }

      // Fetch lab tests (from prescriptions with lab items)
      const labItems = prescriptions
        .flatMap((p) => p.items.filter((i) => i.itemType === 'lab'))
        .map((item) => ({
          _id: item.labTestName || '',
          testName: item.labTestName || '',
          testCode: '',
          createdAt: new Date().toISOString(),
          status: 'pending',
        }));
      setLabTests(labItems);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      // Only send fields that are actually being edited
      const updateData = {};

      if (patient) {
        // Only include fields that have changed
        const fieldsToCheck = [
          'firstName',
          'lastName',
          'dateOfBirth',
          'gender',
          'bloodGroup',
          'email',
          'phone',
          'alternatePhone',
          'address',
          'nationalId',
          'insuranceId',
          'medicalHistory',
          'allergies',
          'currentMedications',
          'notes',
        ];

        fieldsToCheck.forEach((key) => {
          const formValue = formData[key];
          const patientValue = patient[key];

          // Only include if the value has changed
          if (JSON.stringify(formValue) !== JSON.stringify(patientValue)) {
            updateData[key] = formValue;
          }
        });

        // Handle emergencyContact separately
        if (formData.emergencyContact) {
          const formEmergencyContact = formData.emergencyContact;
          const patientEmergencyContact = patient.emergencyContact;

          if (JSON.stringify(formEmergencyContact) !== JSON.stringify(patientEmergencyContact)) {
            if (
              formEmergencyContact &&
              Object.keys(formEmergencyContact).some((key) => formEmergencyContact[key])
            ) {
              updateData.emergencyContact = formEmergencyContact;
            }
          }
        }
      }

      const response = await apiClient.put(`/patients/${params.id}`, updateData);
      if (response.success) {
        setIsEditing(false);
        fetchAllData();
      } else {
        setError(response.error?.message || 'Failed to update patient');
      }
    } catch (error) {
      console.error('Failed to update patient:', error);
      setError(error.message || 'Failed to update patient');
    } finally {
      setSaving(false);
    }
  };

  // Redirect if not authenticated (non-blocking)
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  // Show empty state while redirecting
  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <Layout>
        <Loader size='md' className='h-64' />
      </Layout>
    );
  }

  if (!patient) {
    return (
      <Layout>
        <div className='flex items-center justify-center h-64'>
          <div className='text-center'>
            <p className='text-status-error mb-4'>Patient not found</p>
            <Button onClick={() => router.push('/patients')}>Back to Patients</Button>
          </div>
        </div>
      </Layout>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'visits', label: `Visits (${appointments.length})` },
    { id: 'prescriptions', label: `Prescriptions (${prescriptions.length})` },
    { id: 'invoices', label: `Invoices (${invoices.length})` },
    { id: 'lab-tests', label: `Lab Tests (${labTests.length})` },
  ];

  return (
    <Layout>
      <div className='mb-6'>
        <Button variant='secondary' onClick={() => router.push('/patients')} className='mb-4'>
          ← Back to Patients
        </Button>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-h1 text-neutral-900'>
              {patient.firstName} {patient.lastName}
            </h1>
            <p className='text-body-md text-neutral-600 mt-2'>Patient ID: {patient.patientId}</p>
          </div>
          <div className='flex gap-2'>
            {!isEditing ? (
              <>
                <Button variant='secondary' onClick={() => setIsEditing(true)}>
                  Edit Patient
                </Button>
                <Button onClick={() => router.push(`/appointments/new?patientId=${params.id}`)}>
                  + New Appointment
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant='secondary'
                  onClick={() => {
                    setIsEditing(false);
                    setFormData(patient || {});
                    setError('');
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} isLoading={saving}>
                  Save Changes
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className='mb-6 p-4 bg-status-error/10 border border-status-error/30 text-status-error rounded-lg'>
          {error}
        </div>
      )}

      <div>
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        <div className='mt-6'>
          {activeTab === 'overview' && (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <Card>
                <h2 className='text-xl font-semibold mb-4'>Personal Information</h2>
                <div className='space-y-4'>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-body-sm font-medium text-neutral-700 mb-2'>
                        First Name
                      </label>
                      {isEditing ? (
                        <Input
                          value={formData.firstName || ''}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        />
                      ) : (
                        <p className='text-neutral-900'>{patient.firstName}</p>
                      )}
                    </div>
                    <div>
                      <label className='block text-body-sm font-medium text-neutral-700 mb-2'>
                        Last Name
                      </label>
                      {isEditing ? (
                        <Input
                          value={formData.lastName || ''}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        />
                      ) : (
                        <p className='text-neutral-900'>{patient.lastName}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className='block text-body-sm font-medium text-neutral-700 mb-2'>
                      Patient ID
                    </label>
                    <p className='text-neutral-900'>{patient.patientId}</p>
                  </div>
                  <div>
                    <label className='block text-body-sm font-medium text-neutral-700 mb-2'>
                      Date of Birth
                    </label>
                    {isEditing ? (
                      <Input
                        type='date'
                        value={
                          formData.dateOfBirth
                            ? new Date(formData.dateOfBirth).toISOString().split('T')[0]
                            : ''
                        }
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      />
                    ) : (
                      <p className='text-neutral-900'>
                        {new Date(patient.dateOfBirth).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-body-sm font-medium text-neutral-700 mb-2'>
                        Gender
                      </label>
                      {isEditing ? (
                        <select
                          value={formData.gender || ''}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                          className='w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500'
                        >
                          <option value='male'>Male</option>
                          <option value='female'>Female</option>
                          <option value='other'>Other</option>
                        </select>
                      ) : (
                        <p className='text-neutral-900 capitalize'>{patient.gender}</p>
                      )}
                    </div>
                    <div>
                      <label className='block text-body-sm font-medium text-neutral-700 mb-2'>
                        Blood Group
                      </label>
                      {isEditing ? (
                        <select
                          value={formData.bloodGroup || ''}
                          onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                          className='w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500'
                        >
                          <option value=''>Not Specified</option>
                          <option value='A+'>A+</option>
                          <option value='A-'>A-</option>
                          <option value='B+'>B+</option>
                          <option value='B-'>B-</option>
                          <option value='AB+'>AB+</option>
                          <option value='AB-'>AB-</option>
                          <option value='O+'>O+</option>
                          <option value='O-'>O-</option>
                        </select>
                      ) : (
                        <p className='text-neutral-900'>{patient.bloodGroup || 'Not Specified'}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className='block text-body-sm font-medium text-neutral-700 mb-2'>
                      Phone
                    </label>
                    {isEditing ? (
                      <Input
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    ) : (
                      <p className='text-neutral-900'>{patient.phone}</p>
                    )}
                  </div>
                  <div>
                    <label className='block text-body-sm font-medium text-neutral-700 mb-2'>
                      Alternate Phone
                    </label>
                    {isEditing ? (
                      <Input
                        value={formData.alternatePhone || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, alternatePhone: e.target.value })
                        }
                      />
                    ) : (
                      <p className='text-neutral-900'>{patient.alternatePhone || 'Not Provided'}</p>
                    )}
                  </div>
                  <div>
                    <label className='block text-body-sm font-medium text-neutral-700 mb-2'>
                      Email
                    </label>
                    {isEditing ? (
                      <Input
                        type='email'
                        value={formData.email || ''}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    ) : (
                      <p className='text-neutral-900'>{patient.email || 'Not Provided'}</p>
                    )}
                  </div>
                  <div>
                    <label className='block text-body-sm font-medium text-neutral-700 mb-2'>
                      Address
                    </label>
                    {isEditing ? (
                      <div className='space-y-2'>
                        <Input
                          placeholder='Street'
                          value={formData.address?.street || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              address: { ...formData.address, street: e.target.value },
                            })
                          }
                        />
                        <div className='grid grid-cols-2 gap-2'>
                          <Input
                            placeholder='City'
                            value={formData.address?.city || ''}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                address: { ...formData.address, city: e.target.value },
                              })
                            }
                          />
                          <Input
                            placeholder='State'
                            value={formData.address?.state || ''}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                address: { ...formData.address, state: e.target.value },
                              })
                            }
                          />
                        </div>
                        <Input
                          placeholder='ZIP Code'
                          value={formData.address?.zipCode || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              address: { ...formData.address, zipCode: e.target.value },
                            })
                          }
                        />
                      </div>
                    ) : (
                      <p className='text-neutral-900'>
                        {patient.address
                          ? [
                              patient.address.street,
                              patient.address.city,
                              patient.address.state,
                              patient.address.zipCode,
                            ]
                              .filter(Boolean)
                              .join(', ') || 'Not Provided'
                          : 'Not Provided'}
                      </p>
                    )}
                  </div>
                </div>
              </Card>

              <Card>
                <h2 className='text-xl font-semibold mb-4'>Medical Information</h2>
                <div className='space-y-4'>
                  <div>
                    <label className='block text-body-sm font-medium text-neutral-700 mb-2'>
                      Medical History
                    </label>
                    {isEditing ? (
                      <textarea
                        value={formData.medicalHistory || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, medicalHistory: e.target.value })
                        }
                        className='w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500'
                        rows={4}
                      />
                    ) : (
                      <p className='text-neutral-900 whitespace-pre-wrap'>
                        {patient.medicalHistory || 'Not Provided'}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className='block text-body-sm font-medium text-neutral-700 mb-2'>
                      Allergies
                    </label>
                    {isEditing ? (
                      <Input
                        value={formData.allergies || ''}
                        onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                      />
                    ) : (
                      <p className='text-neutral-900'>{patient.allergies || 'None Known'}</p>
                    )}
                  </div>
                  <div>
                    <label className='block text-body-sm font-medium text-neutral-700 mb-2'>
                      Current Medications
                    </label>
                    {isEditing ? (
                      <textarea
                        value={formData.currentMedications || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, currentMedications: e.target.value })
                        }
                        className='w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500'
                        rows={3}
                      />
                    ) : (
                      <p className='text-neutral-900 whitespace-pre-wrap'>
                        {patient.currentMedications || 'None'}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className='block text-body-sm font-medium text-neutral-700 mb-2'>
                      Notes
                    </label>
                    {isEditing ? (
                      <textarea
                        value={formData.notes || ''}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className='w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500'
                        rows={3}
                      />
                    ) : (
                      <p className='text-neutral-900 whitespace-pre-wrap'>
                        {patient.notes || 'No Notes'}
                      </p>
                    )}
                  </div>
                </div>
              </Card>

              <Card className='md:col-span-2'>
                <h2 className='text-xl font-semibold mb-4'>Quick Stats</h2>
                <div className='grid grid-cols-4 gap-4'>
                  <div className='text-center p-4 bg-primary-100 rounded-lg'>
                    <div className='text-2xl font-bold text-primary-600'>{appointments.length}</div>
                    <div className='text-sm text-neutral-600'>Total Visits</div>
                  </div>
                  <div className='text-center p-4 bg-secondary-100 rounded-lg'>
                    <div className='text-2xl font-bold text-secondary-600'>
                      {prescriptions.length}
                    </div>
                    <div className='text-sm text-neutral-600'>Prescriptions</div>
                  </div>
                  <div className='text-center p-4 bg-purple-50 rounded-lg'>
                    <div className='text-2xl font-bold text-purple-600'>{invoices.length}</div>
                    <div className='text-sm text-neutral-600'>Invoices</div>
                  </div>
                  <div className='text-center p-4 bg-orange-50 rounded-lg'>
                    <div className='text-2xl font-bold text-orange-600'>{labTests.length}</div>
                    <div className='text-sm text-neutral-600'>Lab Tests</div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'visits' && (
            <Card>
              <div className='overflow-x-auto'>
                <table className='min-w-full divide-y divide-gray-200'>
                  <thead className='bg-neutral-100'>
                    <tr>
                      <th className='px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase'>
                        Date
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase'>
                        Time
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase'>
                        Type
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase'>
                        Doctor
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase'>
                        Status
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase'>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className='bg-white divide-y divide-gray-200'>
                    {appointments.map((apt) => (
                      <tr key={apt._id} className='hover:bg-neutral-100'>
                        <td className='px-6 py-4 whitespace-nowrap text-sm'>
                          {new Date(apt.appointmentDate).toLocaleDateString()}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm'>
                          {apt.startTime || '-'}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm capitalize'>
                          {apt.type || 'In-Person'}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm'>
                          {apt.doctorId
                            ? `Dr. ${apt.doctorId.firstName} ${apt.doctorId.lastName}`
                            : '-'}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              apt.status === 'completed'
                                ? 'bg-secondary-100 text-secondary-700'
                                : apt.status === 'in_progress'
                                ? 'bg-primary-100 text-primary-700'
                                : apt.status === 'cancelled'
                                ? 'bg-status-error/10 text-status-error'
                                : 'bg-neutral-100 text-neutral-700'
                            }`}
                          >
                            {apt.status}
                          </span>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm'>
                          <Button
                            variant='secondary'
                            size='sm'
                            onClick={() => router.push(`/appointments/${apt._id}`)}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {appointments.length === 0 && (
                      <tr>
                        <td colSpan={6} className='px-6 py-4 text-center text-neutral-500'>
                          No appointments found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {activeTab === 'prescriptions' && (
            <Card>
              <div className='overflow-x-auto'>
                <table className='min-w-full divide-y divide-gray-200'>
                  <thead className='bg-neutral-100'>
                    <tr>
                      <th className='px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase'>
                        Rx #
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase'>
                        Date
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase'>
                        Diagnosis
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase'>
                        Items
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase'>
                        Status
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase'>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className='bg-white divide-y divide-gray-200'>
                    {prescriptions.map((pres) => (
                      <tr key={pres._id} className='hover:bg-neutral-100'>
                        <td className='px-6 py-4 whitespace-nowrap text-body-sm font-medium'>
                          {pres.prescriptionNumber}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm'>
                          {new Date(pres.createdAt).toLocaleDateString()}
                        </td>
                        <td className='px-6 py-4 text-sm'>{pres.diagnosis || '-'}</td>
                        <td className='px-6 py-4 text-sm'>
                          {pres.items.length} item{pres.items.length !== 1 ? 's' : ''}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              pres.status === 'active'
                                ? 'bg-secondary-100 text-secondary-700'
                                : pres.status === 'dispensed'
                                ? 'bg-primary-100 text-primary-700'
                                : 'bg-neutral-100 text-neutral-700'
                            }`}
                          >
                            {pres.status}
                          </span>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm'>
                          <div className='flex gap-2'>
                            <Button
                              variant='secondary'
                              size='sm'
                              onClick={() => router.push(`/prescriptions/${pres._id}/edit`)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant='secondary'
                              size='sm'
                              onClick={() =>
                                window.open(`/prescriptions/${pres._id}/print`, '_blank')
                              }
                            >
                              Print
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {prescriptions.length === 0 && (
                      <tr>
                        <td colSpan={6} className='px-6 py-4 text-center text-neutral-500'>
                          No prescriptions found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {activeTab === 'invoices' && (
            <Card>
              <div className='overflow-x-auto'>
                <table className='min-w-full divide-y divide-gray-200'>
                  <thead className='bg-neutral-100'>
                    <tr>
                      <th className='px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase'>
                        Invoice #
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase'>
                        Date
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase'>
                        Items
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase'>
                        Amount
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase'>
                        Status
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase'>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className='bg-white divide-y divide-gray-200'>
                    {invoices.map((inv) => (
                      <tr key={inv._id} className='hover:bg-neutral-100'>
                        <td className='px-6 py-4 whitespace-nowrap text-body-sm font-medium'>
                          {inv.invoiceNumber}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm'>
                          {new Date(inv.createdAt).toLocaleDateString()}
                        </td>
                        <td className='px-6 py-4 text-sm'>
                          {inv.items.length} item{inv.items.length !== 1 ? 's' : ''}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-body-sm font-medium'>
                          ${inv.totalAmount.toFixed(2)}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              inv.status === 'paid'
                                ? 'bg-secondary-100 text-secondary-700'
                                : inv.status === 'pending'
                                ? 'bg-status-warning/10 text-status-warning'
                                : 'bg-neutral-100 text-neutral-700'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm'>
                          <Button
                            variant='secondary'
                            size='sm'
                            onClick={() => router.push(`/invoices/${inv._id}`)}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {invoices.length === 0 && (
                      <tr>
                        <td colSpan={6} className='px-6 py-4 text-center text-neutral-500'>
                          No invoices found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {activeTab === 'lab-tests' && (
            <Card>
              <div className='overflow-x-auto'>
                <table className='min-w-full divide-y divide-gray-200'>
                  <thead className='bg-neutral-100'>
                    <tr>
                      <th className='px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase'>
                        Test Name
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase'>
                        Test Code
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase'>
                        Date
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase'>
                        Status
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase'>
                        Results
                      </th>
                    </tr>
                  </thead>
                  <tbody className='bg-white divide-y divide-gray-200'>
                    {labTests.map((test, index) => (
                      <tr key={test._id || index} className='hover:bg-neutral-100'>
                        <td className='px-6 py-4 whitespace-nowrap text-body-sm font-medium'>
                          {test.testName}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm'>
                          {test.testCode || '-'}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm'>
                          {new Date(test.createdAt).toLocaleDateString()}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              test.status === 'completed'
                                ? 'bg-secondary-100 text-secondary-700'
                                : test.status === 'pending'
                                ? 'bg-status-warning/10 text-status-warning'
                                : 'bg-neutral-100 text-neutral-700'
                            }`}
                          >
                            {test.status}
                          </span>
                        </td>
                        <td className='px-6 py-4 text-sm'>{test.results || '-'}</td>
                      </tr>
                    ))}
                    {labTests.length === 0 && (
                      <tr>
                        <td colSpan={5} className='px-6 py-4 text-center text-neutral-500'>
                          No lab tests found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
