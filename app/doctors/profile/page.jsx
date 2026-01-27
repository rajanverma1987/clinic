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

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'doctor') {
      router.push('/dashboard');
      return;
    }
    fetchDoctorProfile();
  }, [authLoading, user, router]);

  const fetchDoctorProfile = async () => {
    try {
      setLoading(true);
      const doctorResponse = await apiClient.get(`/doctors/user/${user._id}`);
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
          setClinics([{
            name: '',
            address: '',
            lat: '',
            lng: '',
            photos: [],
            facilities: [],
            parkingInfo: '',
            publicTransportAccess: '',
          }]);
        }

        // Set fees
        setVideoConsultationFee(profile.videoConsultationFee || 0);
        setFollowUpFee(profile.followUpFee || 0);
      } else {
        throw new Error('Doctor profile not found');
      }
    } catch (err) {
      console.error('Failed to fetch doctor profile:', err);
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
      formData.append('professional', JSON.stringify({
        specialization: specializations,
        servicesOffered: servicesOffered,
        languages: languages,
        conditionsTreated: conditionsTreated,
        awards: awards,
      }));
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
        alert('Profile updated successfully');
        fetchDoctorProfile();
      } else {
        alert('Failed to update profile');
      }
    } catch (err) {
      console.error('Failed to save profile:', err);
      alert('Failed to update profile');
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
        <Loader fullScreen size='lg' />
      </Layout>
    );
  }

  if (!user || user.role !== 'doctor') {
    return null;
  }

  const formatCurrency = (amount) => formatCurrencyUtil(amount, currency, locale);

  return (
    <Layout>
      <div className='max-w-7xl mx-auto space-y-6'>
        <PageHeader
          title='Profile Management'
          subtitle='Manage your professional profile, clinic details, and fees'
        />

        {/* Tabs */}
        <div className='flex gap-2 border-b border-neutral-200'>
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'profile'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'clinic'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
            onClick={() => setActiveTab('clinic')}
          >
            Clinic Details
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'fees'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
            onClick={() => setActiveTab('fees')}
          >
            Fees & Insurance
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'availability'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
            onClick={() => setActiveTab('availability')}
          >
            Availability
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <Card>
            <div className='p-6 space-y-6'>
              {/* Profile Photo Upload */}
              <div>
                <h2 className='text-lg font-bold text-neutral-900 mb-4'>Profile Photo</h2>
                <div className='flex items-center gap-6'>
                  <div className='w-32 h-32 rounded-full bg-neutral-200 flex items-center justify-center overflow-hidden border-4 border-neutral-300'>
                    {profilePhotoPreview ? (
                      <img src={profilePhotoPreview} alt='Profile' className='w-full h-full object-cover' />
                    ) : (
                      <svg className='w-16 h-16 text-neutral-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
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
                        <svg className='icon icon-xs mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' />
                        </svg>
                        Upload Photo
                      </Button>
                    </label>
                    <p className='text-xs text-neutral-500 mt-2'>JPG, PNG or GIF. Max size 5MB</p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className='text-lg font-bold text-neutral-900 mb-4'>About Me</h2>
                <textarea
                  className='w-full p-3 border border-neutral-300 rounded-lg'
                  rows={5}
                  placeholder='Write about yourself, your experience, and expertise...'
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>

              <div>
                <h2 className='text-lg font-bold text-neutral-900 mb-4'>Specializations</h2>
                <div className='flex gap-2 mb-3'>
                  <Input
                    type='text'
                    placeholder='Add specialization'
                    value={newSpecialization}
                    onChange={(e) => setNewSpecialization(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSpecialization()}
                  />
                  <Button variant='secondary' onClick={addSpecialization}>
                    Add
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
                <h2 className='text-lg font-bold text-neutral-900 mb-4'>Services Offered</h2>
                <div className='flex gap-2 mb-3'>
                  <Input
                    type='text'
                    placeholder='Add service (e.g., General Checkup, Vaccination, Health Screening)'
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (() => {
                      if (newService.trim() && !servicesOffered.includes(newService.trim())) {
                        setServicesOffered([...servicesOffered, newService.trim()]);
                        setNewService('');
                      }
                    })()}
                  />
                  <Button variant='secondary' onClick={() => {
                    if (newService.trim() && !servicesOffered.includes(newService.trim())) {
                      setServicesOffered([...servicesOffered, newService.trim()]);
                      setNewService('');
                    }
                  }}>
                    Add
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
                        onClick={() => setServicesOffered(servicesOffered.filter((_, i) => i !== index))}
                        className='text-blue-600 hover:text-blue-800'
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h2 className='text-lg font-bold text-neutral-900 mb-4'>Languages Spoken</h2>
                <div className='flex gap-2 mb-3'>
                  <Input
                    type='text'
                    placeholder='Add language'
                    value={newLanguage}
                    onChange={(e) => setNewLanguage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addLanguage()}
                  />
                  <Button variant='secondary' onClick={addLanguage}>
                    Add
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
                <h2 className='text-lg font-bold text-neutral-900 mb-4'>Awards & Recognitions</h2>
                <div className='flex gap-2 mb-3'>
                  <Input
                    type='text'
                    placeholder='Add award or recognition'
                    value={newAward}
                    onChange={(e) => setNewAward(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addAward()}
                  />
                  <Button variant='secondary' onClick={addAward}>
                    Add
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
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className='flex justify-end'>
                <Button variant='primary' onClick={handleSaveProfile} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Profile'}
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
                <h2 className='text-lg font-bold text-neutral-900'>Clinic Locations</h2>
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
                  + Add Clinic Location
                </Button>
              </div>

              {/* Clinic Locations List */}
              <div className='space-y-4'>
                {clinics.map((clinic, index) => (
                  <Card key={index} className='p-4 border border-neutral-200'>
                    <div className='flex items-start justify-between mb-4'>
                      <div className='flex-1'>
                        <h3 className='font-semibold text-neutral-900 mb-2'>
                          {clinic.name || `Clinic Location ${index + 1}`}
                        </h3>
                        <p className='text-sm text-neutral-600'>{clinic.address || 'No address'}</p>
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
                                <span key={fIndex} className='px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded'>
                                  {facility}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {clinic.parkingInfo && (
                          <p className='text-xs text-neutral-600 mt-1'>
                            <strong>Parking:</strong> {clinic.parkingInfo}
                          </p>
                        )}
                        {clinic.publicTransportAccess && (
                          <p className='text-xs text-neutral-600 mt-1'>
                            <strong>Public Transport:</strong> {clinic.publicTransportAccess}
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
                          variant='outline'
                          size='sm'
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this clinic location?')) {
                              setClinics(clinics.filter((_, i) => i !== index));
                            }
                          }}
                          className='text-red-600 border-red-300'
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
                    {editingClinicIndex !== null ? 'Edit Clinic Location' : 'Add New Clinic Location'}
                  </h3>
                  <div className='space-y-4'>
                    <div>
                      <label className='block text-sm font-medium text-neutral-700 mb-2'>
                        Clinic Name *
                      </label>
                      <Input
                        type='text'
                        value={newClinic.name}
                        onChange={(e) => setNewClinic({ ...newClinic, name: e.target.value })}
                        placeholder='Enter clinic name'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-neutral-700 mb-2'>
                        Address *
                      </label>
                      <textarea
                        className='w-full p-3 border border-neutral-300 rounded-lg'
                        rows={3}
                        value={newClinic.address}
                        onChange={(e) => setNewClinic({ ...newClinic, address: e.target.value })}
                        placeholder='Enter full address'
                      />
                      <p className='text-xs text-neutral-500 mt-1'>
                        Enter address and we'll automatically get coordinates
                      </p>
                    </div>
                    {newClinic.address && (
                      <div>
                        <label className='block text-sm font-medium text-neutral-700 mb-2'>
                          Map Preview
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
                        Facilities Available
                      </label>
                      <div className='flex gap-2 mb-2'>
                        <Input
                          type='text'
                          placeholder='e.g., Parking, Wheelchair Access, Pharmacy'
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
                          Add
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
                        Parking Information
                      </label>
                      <Input
                        type='text'
                        value={newClinic.parkingInfo}
                        onChange={(e) => setNewClinic({ ...newClinic, parkingInfo: e.target.value })}
                        placeholder='e.g., Free parking available, Paid parking nearby'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-neutral-700 mb-2'>
                        Public Transport Access
                      </label>
                      <Input
                        type='text'
                        value={newClinic.publicTransportAccess}
                        onChange={(e) => setNewClinic({ ...newClinic, publicTransportAccess: e.target.value })}
                        placeholder='e.g., Bus stop 100m, Metro station 500m'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-neutral-700 mb-2'>
                        Clinic Photos
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
                            <div key={pIndex} className='relative w-20 h-20 rounded-lg overflow-hidden border border-neutral-300'>
                              {photo instanceof File ? (
                                <img src={URL.createObjectURL(photo)} alt={`Photo ${pIndex + 1}`} className='w-full h-full object-cover' />
                              ) : (
                                <img src={photo} alt={`Photo ${pIndex + 1}`} className='w-full h-full object-cover' />
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
                        {editingClinicIndex !== null ? 'Update Clinic' : 'Add Clinic'}
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              <div className='flex justify-end'>
                <Button variant='primary' onClick={handleSaveProfile} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Clinic Details'}
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
                <h2 className='text-lg font-bold text-neutral-900 mb-4'>Consultation Fees</h2>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-neutral-700 mb-2'>
                      In-Clinic Consultation
                    </label>
                    <Input
                      type='number'
                      min='0'
                      step='0.01'
                      value={consultationFee}
                      onChange={(e) => setConsultationFee(parseFloat(e.target.value) || 0)}
                    />
                    <p className='text-xs text-neutral-500 mt-1'>
                      Current: {formatCurrency(consultationFee)}
                    </p>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-neutral-700 mb-2'>
                      Video Consultation
                    </label>
                    <Input
                      type='number'
                      min='0'
                      step='0.01'
                      value={videoConsultationFee}
                      onChange={(e) => setVideoConsultationFee(parseFloat(e.target.value) || 0)}
                    />
                    <p className='text-xs text-neutral-500 mt-1'>
                      Current: {formatCurrency(videoConsultationFee)}
                    </p>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-neutral-700 mb-2'>
                      Follow-up Consultation
                    </label>
                    <Input
                      type='number'
                      min='0'
                      step='0.01'
                      value={followUpFee}
                      onChange={(e) => setFollowUpFee(parseFloat(e.target.value) || 0)}
                    />
                    <p className='text-xs text-neutral-500 mt-1'>
                      Current: {formatCurrency(followUpFee)}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className='text-lg font-bold text-neutral-900 mb-4'>Procedure Fees</h2>
                <div className='space-y-3 mb-4'>
                  <div className='grid grid-cols-2 gap-3'>
                    <Input
                      type='text'
                      placeholder='Procedure name (e.g., ECG, X-Ray)'
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
                            setProcedureFees([...procedureFees, { name: newProcedureName.trim(), fee: newProcedureFee }]);
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
                          <p className='text-sm text-neutral-600'>{formatCurrency(procedure.fee)}</p>
                        </div>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => setProcedureFees(procedureFees.filter((_, i) => i !== index))}
                          className='text-red-600'
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className='text-sm text-neutral-500'>No procedure fees added</p>
                )}
              </div>

              <div>
                <h2 className='text-lg font-bold text-neutral-900 mb-4'>Insurance Accepted</h2>
                <div className='flex gap-2 mb-3'>
                  <Input
                    type='text'
                    placeholder='Add insurance provider'
                    value={newInsurance}
                    onChange={(e) => setNewInsurance(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addInsurance()}
                  />
                  <Button variant='secondary' onClick={addInsurance}>
                    Add
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
                  {saving ? 'Saving...' : 'Save Fees'}
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
                <h2 className='text-lg font-bold text-neutral-900'>Schedule Management</h2>
                <Button
                  variant='secondary'
                  onClick={() => router.push('/doctors/schedule')}
                >
                  Manage Schedule
                </Button>
              </div>
              <p className='text-neutral-600'>
                Manage your working hours, breaks, holidays, and availability settings.
              </p>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}
