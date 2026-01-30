'use client';

import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useSettings } from '@/hooks/useSettings';
import { apiClient } from '@/lib/api/client';
import { formatCurrency as formatCurrencyUtil } from '@/lib/utils/currency';
import { logger } from '@/lib/utils/logger';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DoctorProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const { currency, locale } = useSettings();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [doctorId, setDoctorId] = useState(null);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('profile'); // profile, clinic, fees, availability

  // Profile fields
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState('');
  const [bio, setBio] = useState('');
  const [specializations, setSpecializations] = useState([]);
  const [newSpecialization, setNewSpecialization] = useState('');
  const [servicesOffered, setServicesOffered] = useState([]);
  const [newService, setNewService] = useState('');
  const [languages, setLanguages] = useState([]);
  const [newLanguage, setNewLanguage] = useState('');
  const [conditionsTreated, setConditionsTreated] = useState([]);
  const [newCondition, setNewCondition] = useState('');
  const [awards, setAwards] = useState([]);
  const [newAward, setNewAward] = useState('');

  // Clinic fields
  const [clinics, setClinics] = useState([]);
  const [editingClinicIndex, setEditingClinicIndex] = useState(null);
  const [newClinic, setNewClinic] = useState({
    name: '',
    address: '',
    lat: '',
    lng: '',
    photos: [],
    facilities: [],
    parkingInfo: '',
    publicTransportAccess: '',
  });
  const [newFacility, setNewFacility] = useState('');

  // Fee fields
  const [consultationFee, setConsultationFee] = useState(0);
  const [videoConsultationFee, setVideoConsultationFee] = useState(0);
  const [followUpFee, setFollowUpFee] = useState(0);
  const [procedureFees, setProcedureFees] = useState([]); // Array of {name, fee}
  const [newProcedureName, setNewProcedureName] = useState('');
  const [newProcedureFee, setNewProcedureFee] = useState(0);
  const [insuranceAccepted, setInsuranceAccepted] = useState([]);
  const [newInsurance, setNewInsurance] = useState('');

  const userId = user?._id ?? user?.id ?? user?.userId;

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'doctor') {
      router.push('/dashboard');
      return;
    }
    if (!userId) return;
    fetchDoctorProfile();
  }, [authLoading, user, userId, router]);

  const fetchDoctorProfile = async () => {
    if (!userId || userId === 'undefined') return;
    try {
      setLoading(true);
      const doctorResponse = await apiClient.get(`/doctors/user/${encodeURIComponent(userId)}`);
      if (doctorResponse.success && doctorResponse.data) {
        const profile = doctorResponse.data;
        setDoctorId(profile._id);
        setDoctorProfile(profile);

        // Set profile fields
        setBio(profile.bio || '');
        setSpecializations(profile.professional?.specialization || []);
        setLanguages(profile.professional?.languages || []);
        setConsultationFee(profile.consultationFee || 0);

        // Set clinic info (if exists)
        if (profile.clinics && profile.clinics.length > 0) {
          setClinics(profile.clinics);
        } else {
          // Initialize with empty clinic if none exists
          setClinics([
            {
              name: '',
              address: '',
              lat: '',
              lng: '',
              photos: [],
              facilities: [],
              parkingInfo: '',
              publicTransportAccess: '',
            },
          ]);
        }

        // Set fees
        setVideoConsultationFee(profile.videoConsultationFee || 0);
        setFollowUpFee(profile.followUpFee || 0);
      } else {
        setDoctorProfile(null);
      }
    } catch (err) {
      setDoctorProfile(null);
      logger.warn('Doctor profile not found or not yet created');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      setProfilePhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!doctorId) return;

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('bio', bio);
      formData.append(
        'professional',
        JSON.stringify({
          specialization: specializations,
          servicesOffered: servicesOffered,
          languages: languages,
          conditionsTreated: conditionsTreated,
          awards: awards,
        })
      );
      formData.append('consultationFee', consultationFee);
      formData.append('videoConsultationFee', videoConsultationFee);
      formData.append('followUpFee', followUpFee);
      formData.append('procedureFees', JSON.stringify(procedureFees));
      formData.append('insuranceAccepted', JSON.stringify(insuranceAccepted));
      formData.append('clinics', JSON.stringify(clinics));

      if (profilePhoto) {
        formData.append('profilePhoto', profilePhoto);
      }

      const response = await apiClient.put(`/doctors/${doctorId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.success) {
        alert(t('doctors.profileUpdatedSuccess'));
        fetchDoctorProfile();
      } else {
        alert(t('doctors.profileUpdateFailed'));
      }
    } catch (err) {
      logger.error('Failed to save profile:', err);
      alert(t('doctors.profileUpdateFailed'));
    } finally {
      setSaving(false);
    }
  };

  const addSpecialization = () => {
    if (newSpecialization.trim() && !specializations.includes(newSpecialization.trim())) {
      setSpecializations([...specializations, newSpecialization.trim()]);
      setNewSpecialization('');
    }
  };

  const removeSpecialization = (index) => {
    setSpecializations(specializations.filter((_, i) => i !== index));
  };

  const addLanguage = () => {
    if (newLanguage.trim() && !languages.includes(newLanguage.trim())) {
      setLanguages([...languages, newLanguage.trim()]);
      setNewLanguage('');
    }
  };

  const removeLanguage = (index) => {
    setLanguages(languages.filter((_, i) => i !== index));
  };

  const addCondition = () => {
    if (newCondition.trim() && !conditionsTreated.includes(newCondition.trim())) {
      setConditionsTreated([...conditionsTreated, newCondition.trim()]);
      setNewCondition('');
    }
  };

  const removeCondition = (index) => {
    setConditionsTreated(conditionsTreated.filter((_, i) => i !== index));
  };

  const addAward = () => {
    if (newAward.trim() && !awards.includes(newAward.trim())) {
      setAwards([...awards, newAward.trim()]);
      setNewAward('');
    }
  };

  const removeAward = (index) => {
    setAwards(awards.filter((_, i) => i !== index));
  };

  const addInsurance = () => {
    if (newInsurance.trim() && !insuranceAccepted.includes(newInsurance.trim())) {
      setInsuranceAccepted([...insuranceAccepted, newInsurance.trim()]);
      setNewInsurance('');
    }
  };

  const removeInsurance = (index) => {
    setInsuranceAccepted(insuranceAccepted.filter((_, i) => i !== index));
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <Loader type='page' text={t('common.loading')} />
      </Layout>
    );
  }

  if (!user || user.role !== 'doctor') {
    return null;
  }

  const formatCurrency = (amount) => formatCurrencyUtil(amount, currency, locale);

  return (
    <Layout>
      <div style={{ padding: '0 10px' }} className='space-y-6'>
        <PageHeader
          title={t('doctors.profileManagement')}
          subtitle={t('doctors.profileManagementSubtitle')}
        />

        {/* Tabs */}
        <div className='flex gap-2 border-b border-neutral-200'>
          <button
            type='button'
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'profile'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
            onClick={() => setActiveTab('profile')}
          >
            {t('doctors.tabProfile')}
          </button>
          <button
            type='button'
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'clinic'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
            onClick={() => setActiveTab('clinic')}
          >
            {t('doctors.tabClinicDetails')}
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'fees'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
            onClick={() => setActiveTab('fees')}
          >
            {t('doctors.tabFeesInsurance')}
          </button>
          <button
            type='button'
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'availability'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
            onClick={() => setActiveTab('availability')}
          >
            {t('doctors.tabAvailability')}
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <Card>
            <div className='p-6 space-y-6'>
              {/* Profile Photo Upload */}
              <div>
                <h2 className='text-lg font-bold text-neutral-900 mb-4'>
                  {t('doctors.profilePhoto')}
                </h2>
                <div className='flex items-center gap-6'>
                  <div className='w-32 h-32 rounded-full bg-neutral-200 flex items-center justify-center overflow-hidden border-4 border-neutral-300'>
                    {profilePhotoPreview ? (
                      <img
                        src={profilePhotoPreview}
                        alt='Profile'
                        className='w-full h-full object-cover'
                      />
                    ) : (
                      <svg
                        className='w-16 h-16 text-neutral-400'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                        />
                      </svg>
                    )}
                  </div>
                  <div>
                    <label className='block'>
                      <input
                        type='file'
                        accept='image/*'
                        onChange={handlePhotoUpload}
                        className='hidden'
                      />
                      <Button variant='secondary' as='span'>
                        <svg
                          className='icon icon-xs mr-2'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12'
                          />
                        </svg>
                        {t('doctors.uploadPhoto')}
                      </Button>
                    </label>
                    <p className='text-xs text-neutral-500 mt-2'>{t('doctors.imageSizeHint')}</p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className='text-lg font-bold text-neutral-900 mb-4'>{t('doctors.aboutMe')}</h2>
                <textarea
                  className='w-full p-3 border border-neutral-300 rounded-lg'
                  rows={5}
                  placeholder={t('doctors.aboutMePlaceholder')}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>

              <div>
                <h2 className='text-lg font-bold text-neutral-900 mb-4'>
                  {t('doctors.specializations')}
                </h2>
                <div className='flex gap-2 mb-3'>
                  <Input
                    type='text'
                    placeholder={t('doctors.addSpecialization')}
                    value={newSpecialization}
                    onChange={(e) => setNewSpecialization(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSpecialization()}
                  />
                  <Button variant='secondary' onClick={addSpecialization}>
                    {t('doctors.add')}
                  </Button>
                </div>
                <div className='flex flex-wrap gap-2'>
                  {specializations.map((spec, index) => (
                    <span
                      key={index}
                      className='inline-flex items-center gap-2 px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm'
                    >
                      {spec}
                      <button
                        onClick={() => removeSpecialization(index)}
                        className='text-primary-600 hover:text-primary-800'
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h2 className='text-lg font-bold text-neutral-900 mb-4'>
                  {t('doctors.servicesOffered')}
                </h2>
                <div className='flex gap-2 mb-3'>
                  <Input
                    type='text'
                    placeholder={t('doctors.addServicePlaceholder')}
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === 'Enter' &&
                      (() => {
                        if (newService.trim() && !servicesOffered.includes(newService.trim())) {
                          setServicesOffered([...servicesOffered, newService.trim()]);
                          setNewService('');
                        }
                      })()
                    }
                  />
                  <Button
                    variant='secondary'
                    onClick={() => {
                      if (newService.trim() && !servicesOffered.includes(newService.trim())) {
                        setServicesOffered([...servicesOffered, newService.trim()]);
                        setNewService('');
                      }
                    }}
                  >
                    {t('doctors.add')}
                  </Button>
                </div>
                <div className='flex flex-wrap gap-2'>
                  {servicesOffered.map((service, index) => (
                    <span
                      key={index}
                      className='inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm'
                    >
                      {service}
                      <button
                        onClick={() =>
                          setServicesOffered(servicesOffered.filter((_, i) => i !== index))
                        }
                        className='text-blue-600 hover:text-blue-800'
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h2 className='text-lg font-bold text-neutral-900 mb-4'>
                  {t('doctors.languagesSpoken')}
                </h2>
                <div className='flex gap-2 mb-3'>
                  <Input
                    type='text'
                    placeholder={t('doctors.addLanguage')}
                    value={newLanguage}
                    onChange={(e) => setNewLanguage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addLanguage()}
                  />
                  <Button variant='secondary' onClick={addLanguage}>
                    {t('doctors.add')}
                  </Button>
                </div>
                <div className='flex flex-wrap gap-2'>
                  {languages.map((lang, index) => (
                    <span
                      key={index}
                      className='inline-flex items-center gap-2 px-3 py-1 bg-neutral-100 text-neutral-800 rounded-full text-sm'
                    >
                      {lang}
                      <button
                        onClick={() => removeLanguage(index)}
                        className='text-neutral-600 hover:text-neutral-800'
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h2 className='text-lg font-bold text-neutral-900 mb-4'>Conditions Treated</h2>
                <div className='flex gap-2 mb-3'>
                  <Input
                    type='text'
                    placeholder='Add condition'
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addCondition()}
                  />
                  <Button variant='secondary' onClick={addCondition}>
                    Add
                  </Button>
                </div>
                <div className='flex flex-wrap gap-2'>
                  {conditionsTreated.map((condition, index) => (
                    <span
                      key={index}
                      className='inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm'
                    >
                      {condition}
                      <button
                        onClick={() => removeCondition(index)}
                        className='text-green-600 hover:text-green-800'
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h2 className='text-lg font-bold text-neutral-900 mb-4'>
                  {t('doctors.awardsRecognitions')}
                </h2>
                <div className='flex gap-2 mb-3'>
                  <Input
                    type='text'
                    placeholder={t('doctors.addAwardPlaceholder')}
                    value={newAward}
                    onChange={(e) => setNewAward(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addAward()}
                  />
                  <Button variant='secondary' onClick={addAward}>
                    {t('doctors.add')}
                  </Button>
                </div>
                <div className='space-y-2'>
                  {awards.map((award, index) => (
                    <div
                      key={index}
                      className='flex items-center justify-between p-3 bg-neutral-50 rounded-lg'
                    >
                      <span className='text-neutral-900'>{award}</span>
                      <button
                        onClick={() => removeAward(index)}
                        className='text-red-600 hover:text-red-800'
                      >
                        {t('doctors.remove')}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className='flex justify-end'>
                <Button variant='primary' onClick={handleSaveProfile} disabled={saving}>
                  {saving ? t('doctors.saving') : t('doctors.saveProfile')}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Clinic Tab */}
        {activeTab === 'clinic' && (
          <Card>
            <div className='p-6 space-y-6'>
              <div className='flex items-center justify-between mb-4'>
                <h2 className='text-lg font-bold text-neutral-900'>
                  {t('doctors.clinicLocations')}
                </h2>
                <Button
                  variant='primary'
                  size='sm'
                  onClick={() => {
                    setEditingClinicIndex(null);
                    setNewClinic({
                      name: '',
                      address: '',
                      lat: '',
                      lng: '',
                      photos: [],
                      facilities: [],
                      parkingInfo: '',
                      publicTransportAccess: '',
                    });
                  }}
                >
                  {t('doctors.addClinicLocation')}
                </Button>
              </div>

              {/* Clinic Locations List */}
              <div className='space-y-4'>
                {clinics.map((clinic, index) => (
                  <Card key={index} className='p-4 border border-neutral-200'>
                    <div className='flex items-start justify-between mb-4'>
                      <div className='flex-1'>
                        <h3 className='font-semibold text-neutral-900 mb-2'>
                          {clinic.name || t('doctors.clinicLocationN', { n: index + 1 })}
                        </h3>
                        <p className='text-sm text-neutral-600'>
                          {clinic.address || t('doctors.noAddress')}
                        </p>
                        {clinic.lat && clinic.lng && (
                          <div className='mt-2'>
                            <iframe
                              width='100%'
                              height='150'
                              style={{ border: 0 }}
                              loading='lazy'
                              allowFullScreen
                              referrerPolicy='no-referrer-when-downgrade'
                              src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyDummyKey'}&q=${clinic.lat},${clinic.lng}`}
                            />
                          </div>
                        )}
                        {clinic.facilities && clinic.facilities.length > 0 && (
                          <div className='mt-2'>
                            <p className='text-xs text-neutral-500 mb-1'>Facilities:</p>
                            <div className='flex flex-wrap gap-1'>
                              {clinic.facilities.map((facility, fIndex) => (
                                <span
                                  key={fIndex}
                                  className='px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded'
                                >
                                  {facility}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {clinic.parkingInfo && (
                          <p className='text-xs text-neutral-600 mt-1'>
                            <strong>{t('doctors.parking')}</strong> {clinic.parkingInfo}
                          </p>
                        )}
                        {clinic.publicTransportAccess && (
                          <p className='text-xs text-neutral-600 mt-1'>
                            <strong>{t('doctors.publicTransport')}</strong>{' '}
                            {clinic.publicTransportAccess}
                          </p>
                        )}
                      </div>
                      <div className='flex gap-2 ml-4'>
                        <Button
                          variant='secondary'
                          size='sm'
                          onClick={() => {
                            setEditingClinicIndex(index);
                            setNewClinic({ ...clinic });
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant='danger'
                          size='sm'
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this clinic location?')) {
                              setClinics(clinics.filter((_, i) => i !== index));
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Add/Edit Clinic Modal */}
              {(editingClinicIndex !== null || (editingClinicIndex === null && newClinic.name)) && (
                <Card className='p-6 border-2 border-primary-200 bg-primary-50'>
                  <h3 className='text-lg font-bold text-neutral-900 mb-4'>
                    {editingClinicIndex !== null
                      ? t('doctors.editClinicLocation')
                      : t('doctors.addNewClinicLocation')}
                  </h3>
                  <div className='space-y-4'>
                    <div>
                      <label className='block text-sm font-medium text-neutral-700 mb-2'>
                        {t('doctors.clinicNameRequired')}
                      </label>
                      <Input
                        type='text'
                        value={newClinic.name}
                        onChange={(e) => setNewClinic({ ...newClinic, name: e.target.value })}
                        placeholder={t('doctors.enterClinicName')}
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-neutral-700 mb-2'>
                        {t('doctors.addressRequired')}
                      </label>
                      <textarea
                        className='w-full p-3 border border-neutral-300 rounded-lg'
                        rows={3}
                        value={newClinic.address}
                        onChange={(e) => setNewClinic({ ...newClinic, address: e.target.value })}
                        placeholder={t('doctors.enterFullAddress')}
                      />
                      <p className='text-xs text-neutral-500 mt-1'>
                        {t('doctors.addressCoordsHint')}
                      </p>
                    </div>
                    {newClinic.address && (
                      <div>
                        <label className='block text-sm font-medium text-neutral-700 mb-2'>
                          {t('doctors.mapPreview')}
                        </label>
                        <div className='h-48 border border-neutral-300 rounded-lg overflow-hidden'>
                          <iframe
                            width='100%'
                            height='100%'
                            style={{ border: 0 }}
                            loading='lazy'
                            allowFullScreen
                            referrerPolicy='no-referrer-when-downgrade'
                            src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyDummyKey'}&q=${encodeURIComponent(newClinic.address)}`}
                          />
                        </div>
                      </div>
                    )}
                    <div>
                      <label className='block text-sm font-medium text-neutral-700 mb-2'>
                        {t('doctors.facilitiesAvailable')}
                      </label>
                      <div className='flex gap-2 mb-2'>
                        <Input
                          type='text'
                          placeholder={t('doctors.facilitiesPlaceholder')}
                          value={newFacility}
                          onChange={(e) => setNewFacility(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && newFacility.trim()) {
                              setNewClinic({
                                ...newClinic,
                                facilities: [...(newClinic.facilities || []), newFacility.trim()],
                              });
                              setNewFacility('');
                            }
                          }}
                        />
                        <Button
                          variant='secondary'
                          onClick={() => {
                            if (newFacility.trim()) {
                              setNewClinic({
                                ...newClinic,
                                facilities: [...(newClinic.facilities || []), newFacility.trim()],
                              });
                              setNewFacility('');
                            }
                          }}
                        >
                          {t('doctors.add')}
                        </Button>
                      </div>
                      <div className='flex flex-wrap gap-2'>
                        {newClinic.facilities?.map((facility, fIndex) => (
                          <span
                            key={fIndex}
                            className='inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm'
                          >
                            {facility}
                            <button
                              onClick={() => {
                                setNewClinic({
                                  ...newClinic,
                                  facilities: newClinic.facilities.filter((_, i) => i !== fIndex),
                                });
                              }}
                              className='text-blue-600 hover:text-blue-800'
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-neutral-700 mb-2'>
                        {t('doctors.parkingInfo')}
                      </label>
                      <Input
                        type='text'
                        value={newClinic.parkingInfo}
                        onChange={(e) =>
                          setNewClinic({ ...newClinic, parkingInfo: e.target.value })
                        }
                        placeholder={t('doctors.parkingPlaceholder')}
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-neutral-700 mb-2'>
                        {t('doctors.publicTransportAccess')}
                      </label>
                      <Input
                        type='text'
                        value={newClinic.publicTransportAccess}
                        onChange={(e) =>
                          setNewClinic({ ...newClinic, publicTransportAccess: e.target.value })
                        }
                        placeholder={t('doctors.publicTransportPlaceholder')}
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-neutral-700 mb-2'>
                        {t('doctors.clinicPhotos')}
                      </label>
                      <input
                        type='file'
                        accept='image/*'
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files);
                          setNewClinic({
                            ...newClinic,
                            photos: [...(newClinic.photos || []), ...files],
                          });
                        }}
                        className='w-full p-2 border border-neutral-300 rounded-lg'
                      />
                      {newClinic.photos && newClinic.photos.length > 0 && (
                        <div className='flex flex-wrap gap-2 mt-2'>
                          {newClinic.photos.map((photo, pIndex) => (
                            <div
                              key={pIndex}
                              className='relative w-20 h-20 rounded-lg overflow-hidden border border-neutral-300'
                            >
                              {photo instanceof File ? (
                                <img
                                  src={URL.createObjectURL(photo)}
                                  alt={`Photo ${pIndex + 1}`}
                                  className='w-full h-full object-cover'
                                />
                              ) : (
                                <img
                                  src={photo}
                                  alt={`Photo ${pIndex + 1}`}
                                  className='w-full h-full object-cover'
                                />
                              )}
                              <button
                                onClick={() => {
                                  setNewClinic({
                                    ...newClinic,
                                    photos: newClinic.photos.filter((_, i) => i !== pIndex),
                                  });
                                }}
                                className='absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs'
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className='flex justify-end gap-3'>
                      <Button
                        variant='secondary'
                        onClick={() => {
                          setEditingClinicIndex(null);
                          setNewClinic({
                            name: '',
                            address: '',
                            lat: '',
                            lng: '',
                            photos: [],
                            facilities: [],
                            parkingInfo: '',
                            publicTransportAccess: '',
                          });
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant='primary'
                        onClick={() => {
                          if (!newClinic.name || !newClinic.address) {
                            alert('Please fill in clinic name and address');
                            return;
                          }
                          if (editingClinicIndex !== null) {
                            const updated = [...clinics];
                            updated[editingClinicIndex] = newClinic;
                            setClinics(updated);
                          } else {
                            setClinics([...clinics, newClinic]);
                          }
                          setEditingClinicIndex(null);
                          setNewClinic({
                            name: '',
                            address: '',
                            lat: '',
                            lng: '',
                            photos: [],
                            facilities: [],
                            parkingInfo: '',
                            publicTransportAccess: '',
                          });
                        }}
                      >
                        {editingClinicIndex !== null
                          ? t('doctors.updateClinic')
                          : t('doctors.addClinic')}
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              <div className='flex justify-end'>
                <Button variant='primary' onClick={handleSaveProfile} disabled={saving}>
                  {saving ? t('doctors.saving') : t('doctors.saveClinicDetails')}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Fees Tab */}
        {activeTab === 'fees' && (
          <Card>
            <div className='p-6 space-y-6'>
              <div>
                <h2 className='text-lg font-bold text-neutral-900 mb-4'>
                  {t('doctors.consultationFees')}
                </h2>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-neutral-700 mb-2'>
                      {t('doctors.inClinicConsultation')}
                    </label>
                    <Input
                      type='number'
                      min='0'
                      step='0.01'
                      value={consultationFee}
                      onChange={(e) => setConsultationFee(parseFloat(e.target.value) || 0)}
                    />
                    <p className='text-xs text-neutral-500 mt-1'>
                      {t('doctors.current')} {formatCurrency(consultationFee)}
                    </p>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-neutral-700 mb-2'>
                      {t('doctors.videoConsultation')}
                    </label>
                    <Input
                      type='number'
                      min='0'
                      step='0.01'
                      value={videoConsultationFee}
                      onChange={(e) => setVideoConsultationFee(parseFloat(e.target.value) || 0)}
                    />
                    <p className='text-xs text-neutral-500 mt-1'>
                      {t('doctors.current')} {formatCurrency(videoConsultationFee)}
                    </p>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-neutral-700 mb-2'>
                      {t('doctors.followUpConsultation')}
                    </label>
                    <Input
                      type='number'
                      min='0'
                      step='0.01'
                      value={followUpFee}
                      onChange={(e) => setFollowUpFee(parseFloat(e.target.value) || 0)}
                    />
                    <p className='text-xs text-neutral-500 mt-1'>
                      {t('doctors.current')} {formatCurrency(followUpFee)}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className='text-lg font-bold text-neutral-900 mb-4'>
                  {t('doctors.procedureFees')}
                </h2>
                <div className='space-y-3 mb-4'>
                  <div className='grid grid-cols-2 gap-3'>
                    <Input
                      type='text'
                      placeholder={t('doctors.procedureNamePlaceholder')}
                      value={newProcedureName}
                      onChange={(e) => setNewProcedureName(e.target.value)}
                    />
                    <div className='flex gap-2'>
                      <Input
                        type='number'
                        min='0'
                        step='0.01'
                        placeholder='Fee'
                        value={newProcedureFee}
                        onChange={(e) => setNewProcedureFee(parseFloat(e.target.value) || 0)}
                      />
                      <Button
                        variant='secondary'
                        onClick={() => {
                          if (newProcedureName.trim() && newProcedureFee > 0) {
                            setProcedureFees([
                              ...procedureFees,
                              { name: newProcedureName.trim(), fee: newProcedureFee },
                            ]);
                            setNewProcedureName('');
                            setNewProcedureFee(0);
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
                {procedureFees.length > 0 ? (
                  <div className='space-y-2'>
                    {procedureFees.map((procedure, index) => (
                      <div
                        key={index}
                        className='flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200'
                      >
                        <div>
                          <p className='font-medium text-neutral-900'>{procedure.name}</p>
                          <p className='text-sm text-neutral-600'>
                            {formatCurrency(procedure.fee)}
                          </p>
                        </div>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() =>
                            setProcedureFees(procedureFees.filter((_, i) => i !== index))
                          }
                          className='text-red-600'
                        >
                          {t('doctors.remove')}
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className='text-sm text-neutral-500'>{t('doctors.noProcedureFees')}</p>
                )}
              </div>

              <div>
                <h2 className='text-lg font-bold text-neutral-900 mb-4'>
                  {t('doctors.insuranceAccepted')}
                </h2>
                <div className='flex gap-2 mb-3'>
                  <Input
                    type='text'
                    placeholder={t('doctors.addInsuranceProvider')}
                    value={newInsurance}
                    onChange={(e) => setNewInsurance(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addInsurance()}
                  />
                  <Button variant='secondary' onClick={addInsurance}>
                    {t('doctors.add')}
                  </Button>
                </div>
                <div className='flex flex-wrap gap-2'>
                  {insuranceAccepted.map((insurance, index) => (
                    <span
                      key={index}
                      className='inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm'
                    >
                      {insurance}
                      <button
                        onClick={() => removeInsurance(index)}
                        className='text-blue-600 hover:text-blue-800'
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className='flex justify-end'>
                <Button variant='primary' onClick={handleSaveProfile} disabled={saving}>
                  {saving ? t('doctors.saving') : t('doctors.saveFees')}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Availability Tab */}
        {activeTab === 'availability' && (
          <Card>
            <div className='p-6'>
              <div className='flex items-center justify-between mb-4'>
                <h2 className='text-lg font-bold text-neutral-900'>
                  {t('doctors.scheduleManagement')}
                </h2>
                <Button variant='secondary' onClick={() => router.push('/doctors/schedule')}>
                  {t('doctors.manageSchedule')}
                </Button>
              </div>
              <p className='text-neutral-600'>{t('doctors.manageScheduleDesc')}</p>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}
