'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Attachment {
  filename: string;
  url: string;
  fileType: string;
  uploadedAt: string;
  uploadedBy: string;
}

interface Patient {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup?: string;
  email?: string;
  phone: string;
  alternatePhone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  nationalId?: string;
  insuranceId?: string;
  medicalHistory?: string;
  allergies?: string;
  currentMedications?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };
  attachments?: Attachment[];
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function PatientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Patient>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    if (!authLoading && user && params.id) {
      fetchPatient();
    }
  }, [authLoading, user, params.id]);

  const fetchPatient = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.get<{ data: Patient }>(`/patients/${params.id}`);
      if (response.success && response.data) {
        setPatient(response.data);
        setFormData(response.data);
      } else {
        setError(response.error?.message || t('patients.failedToLoadPatient'));
      }
    } catch (error: any) {
      console.error('Failed to fetch patient:', error);
      setError(error.message || t('patients.failedToLoadPatient'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      // Only send fields that are actually being edited
      const updateData: any = {};
      
      if (patient) {
        // Only include fields that have changed
        const fieldsToCheck = ['firstName', 'lastName', 'dateOfBirth', 'gender', 'bloodGroup', 
                               'email', 'phone', 'alternatePhone', 'address', 
                               'nationalId', 'insuranceId', 
                               'medicalHistory', 'allergies', 'currentMedications', 'notes'];
        
        fieldsToCheck.forEach((key) => {
          const formValue = (formData as any)[key];
          const patientValue = (patient as any)[key];
          
          // Only include if the value has changed
          if (JSON.stringify(formValue) !== JSON.stringify(patientValue)) {
            updateData[key] = formValue;
          }
        });
        
        // Handle emergencyContact separately - only include if it was actually changed
        // and has at least one field
        if (formData.emergencyContact) {
          const formEmergencyContact = formData.emergencyContact;
          const patientEmergencyContact = patient.emergencyContact;
          
          // Check if it changed
          if (JSON.stringify(formEmergencyContact) !== JSON.stringify(patientEmergencyContact)) {
            // Only include if it has at least one non-empty field
            if (formEmergencyContact && Object.keys(formEmergencyContact).some(
              key => formEmergencyContact[key as keyof typeof formEmergencyContact]
            )) {
              updateData.emergencyContact = formEmergencyContact;
            }
          }
        }
      }
      
      const response = await apiClient.put(`/patients/${params.id}`, updateData);
      if (response.success) {
        setIsEditing(false);
        fetchPatient();
      } else {
        setError(response.error?.message || t('patients.failedToUpdatePatient'));
      }
    } catch (error: any) {
      console.error('Failed to update patient:', error);
      setError(error.message || t('patients.failedToUpdatePatient'));
      } finally {
        setSaving(false);
      }
    };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/patients/${params.id}/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        fetchPatient(); // Refresh patient data
      } else {
        setUploadError(data.error?.message || t('patients.failedToUploadFile'));
      }
    } catch (error: any) {
      console.error('Failed to upload file:', error);
      setUploadError(error.message || t('patients.failedToUploadFile'));
    } finally {
      setUploading(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const handleDeleteAttachment = async (attachment: Attachment) => {
    if (!confirm(t('patients.confirmDeleteAttachment'))) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const attachmentId = new Date(attachment.uploadedAt).getTime().toString();
      const response = await fetch(`/api/patients/${params.id}/upload?attachmentId=${attachmentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        fetchPatient(); // Refresh patient data
      } else {
        setError(data.error?.message || t('patients.failedToDeleteAttachment'));
      }
    } catch (error: any) {
      console.error('Failed to delete attachment:', error);
      setError(error.message || t('patients.failedToDeleteAttachment'));
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">{t('common.loading')}</div>
        </div>
      </Layout>
    );
  }

  if (!patient) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || t('patients.patientNotFound')}</p>
            <Button onClick={() => router.push('/patients')}>{t('patients.backToPatients')}</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <Button variant="outline" onClick={() => router.push('/patients')} className="mb-4">
          ← {t('patients.backToPatients')}
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {patient.firstName} {patient.lastName}
            </h1>
            <p className="text-gray-600 mt-2">{t('patients.patientId')}: {patient.patientId}</p>
          </div>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>{t('patients.editPatient')}</Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleSave} isLoading={saving}>{t('patients.saveChanges')}</Button>
              <Button variant="outline" onClick={() => {
                setIsEditing(false);
                setFormData(patient);
              }}>{t('common.cancel')}</Button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card>
          <h2 className="text-xl font-semibold mb-6">{t('patients.personalInformation')}</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.firstName')}
                </label>
                {isEditing ? (
                  <Input
                    value={formData.firstName || ''}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                ) : (
                  <p className="text-gray-900">{patient.firstName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.lastName')}
                </label>
                {isEditing ? (
                  <Input
                    value={formData.lastName || ''}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                ) : (
                  <p className="text-gray-900">{patient.lastName}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('patients.dateOfBirth')}
              </label>
              {isEditing ? (
                <Input
                  type="date"
                  value={formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString().split('T')[0] : ''}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                />
              ) : (
                <p className="text-gray-900">
                  {new Date(patient.dateOfBirth).toLocaleDateString()}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('patients.gender')}
                </label>
                {isEditing ? (
                  <select
                    value={formData.gender || ''}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="male">{t('common.male')}</option>
                    <option value="female">{t('common.female')}</option>
                    <option value="other">{t('common.other')}</option>
                  </select>
                ) : (
                  <p className="text-gray-900 capitalize">{patient.gender}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('patients.bloodGroup')}
                </label>
                {isEditing ? (
                  <select
                    value={formData.bloodGroup || ''}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{t('patients.notSpecified')}</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                ) : (
                  <p className="text-gray-900">{patient.bloodGroup || t('patients.notSpecified')}</p>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Contact Information */}
        <Card>
          <h2 className="text-xl font-semibold mb-6">{t('patients.contactInformation')}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('patients.phone')}
              </label>
              {isEditing ? (
                <Input
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              ) : (
                <p className="text-gray-900">{patient.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('patients.alternatePhone')}
              </label>
              {isEditing ? (
                <Input
                  value={formData.alternatePhone || ''}
                  onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
                />
              ) : (
                <p className="text-gray-900">{patient.alternatePhone || t('patients.notProvided')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.email')}
              </label>
              {isEditing ? (
                <Input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              ) : (
                <p className="text-gray-900">{patient.email || t('patients.notProvided')}</p>
              )}
            </div>

            {patient.address && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('patients.address')}
                </label>
                <p className="text-gray-900">
                  {[
                    patient.address.street,
                    patient.address.city,
                    patient.address.state,
                    patient.address.zipCode,
                    patient.address.country,
                  ].filter(Boolean).join(', ') || t('patients.notProvided')}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Medical Information */}
        <Card>
          <h2 className="text-xl font-semibold mb-6">{t('patients.medicalInformation')}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('patients.medicalHistory')}
              </label>
              {isEditing ? (
                <textarea
                  value={formData.medicalHistory || ''}
                  onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
              ) : (
                <p className="text-gray-900 whitespace-pre-wrap">{patient.medicalHistory || t('patients.notProvided')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('patients.allergies')}
              </label>
              {isEditing ? (
                <Input
                  value={formData.allergies || ''}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                />
              ) : (
                <p className="text-gray-900">{patient.allergies || t('patients.noneKnown')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('patients.currentMedications')}
              </label>
              {isEditing ? (
                <textarea
                  value={formData.currentMedications || ''}
                  onChange={(e) => setFormData({ ...formData, currentMedications: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              ) : (
                <p className="text-gray-900 whitespace-pre-wrap">{patient.currentMedications || t('common.none')}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Emergency Contact & Notes */}
        <Card>
          <h2 className="text-xl font-semibold mb-6">{t('patients.additionalInformation')}</h2>
          <div className="space-y-4">
            {patient.emergencyContact && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('patients.emergencyContact')}
                </label>
                <p className="text-gray-900">
                  {patient.emergencyContact.name} ({patient.emergencyContact.relationship})
                  <br />
                  {patient.emergencyContact.phone}
                  {patient.emergencyContact.email && (
                    <>
                      <br />
                      {patient.emergencyContact.email}
                    </>
                  )}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('appointments.notes')}
              </label>
              {isEditing ? (
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
              ) : (
                <p className="text-gray-900 whitespace-pre-wrap">{patient.notes || t('patients.noNotes')}</p>
              )}
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-gray-500">
                {t('patients.created')}: {new Date(patient.createdAt).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">
                {t('patients.lastUpdated')}: {new Date(patient.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        {/* Photos & Attachments */}
        <Card>
          <h2 className="text-xl font-semibold mb-6">{t('patients.photosAttachments')}</h2>
          <div className="space-y-4">
            {uploadError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {uploadError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('patients.uploadPhoto')}
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                />
                {uploading && (
                  <span className="text-sm text-gray-500">{t('patients.uploading')}</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {t('patients.supportedFormats')}
              </p>
            </div>

            {patient.attachments && patient.attachments.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                {patient.attachments.map((attachment, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                      {attachment.fileType.startsWith('image/') ? (
                        <img
                          src={attachment.url}
                          alt={attachment.filename}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-gray-400 text-2xl">📄</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-2">
                      <p className="text-xs text-gray-600 truncate" title={attachment.filename}>
                        {attachment.filename}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(attachment.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteAttachment(attachment)}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                      title={t('patients.deleteAttachment')}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {(!patient.attachments || patient.attachments.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <p>{t('patients.noPhotosAttachments')}</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
}

