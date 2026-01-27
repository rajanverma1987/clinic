'use client';

/**
 * Doctor Onboarding Page
 * 
 * 5-step registration process for doctors to join the platform
 * 
 * Steps:
 * 1. Personal Information (Name, Email, Phone, Password)
 * 2. Professional Information (License, Qualification, Specialization, Experience)
 * 3. Schedule Setup (Working Days, Time Slots)
 * 4. Consultation Fees & Services
 * 5. Review & Submit
 * 
 * @module app/doctors/register/page
 * @since 1.0.0
 */

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { Tag } from '@/components/ui/Tag';
import { apiClient } from '@/lib/api/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { logger } from '@/lib/utils/logger.js';

export default function DoctorRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    firstName: '',
    lastName: '',
    email: '',
    emailVerified: false,
    phone: '',
    phoneVerified: false,
    password: '',
    confirmPassword: '',
    specialty: '',
    experienceYears: '',
    
    // Step 2: Professional Details
    licenseNumber: '',
    qualifications: [], // Array of {degree, university, year}
    certifications: [], // Array of {name, issuingOrganization, year}
    specializations: [],
    
    // Step 3: Clinic Details
    clinics: [{ name: '', address: '', lat: '', lng: '', workingHours: {}, consultationFee: '' }], // Multiple locations
    workingHours: {}, // Per location
    
    // Step 4: Documents Upload
    medicalLicense: null,
    degreeCertificates: [], // Array of files
    idProof: null,
    clinicRegistration: null,
    
    // Step 5: Banking Details
    bankAccountNumber: '',
    bankName: '',
    ifscCode: '',
    accountHolderName: '',
    panNumber: '',
    taxDetails: {},
    paymentPreferences: 'weekly', // weekly, bi-weekly, monthly
    
    // Terms
    agreeToTerms: false,
  });
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [otpSent, setOtpSent] = useState({ email: false, phone: false });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field, value, action = 'toggle') => {
    setFormData((prev) => {
      const current = prev[field] || [];
      let updated;
      if (action === 'toggle') {
        updated = current.includes(value)
          ? current.filter((item) => item !== value)
          : [...current, value];
      } else if (action === 'add') {
        updated = [...current, value];
      } else {
        updated = current.filter((item) => item !== value);
      }
      return { ...prev, [field]: updated };
    });
  };

  const handleNext = () => {
    setError('');
    
    // Validation based on step
    if (step === 1) {
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.password || !formData.specialty) {
        setError('Please fill in all required fields');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
      if (!formData.emailVerified) {
        setError('Please verify your email address');
        return;
      }
      if (!formData.phoneVerified) {
        setError('Please verify your phone number');
        return;
      }
    } else if (step === 2) {
      if (!formData.licenseNumber || formData.qualifications.length === 0 || formData.specializations.length === 0) {
        setError('Please fill in all required professional information');
        return;
      }
    } else if (step === 3) {
      if (formData.clinics.length === 0 || !formData.clinics[0].name || !formData.clinics[0].address) {
        setError('Please add at least one clinic with name and address');
        return;
      }
    } else if (step === 4) {
      if (!formData.medicalLicense || formData.degreeCertificates.length === 0 || !formData.idProof) {
        setError('Please upload all required documents');
        return;
      }
    } else if (step === 5) {
      if (!formData.bankAccountNumber || !formData.bankName || !formData.ifscCode || !formData.accountHolderName) {
        setError('Please fill in all banking details');
        return;
      }
    }
    
    setStep((prev) => Math.min(prev + 1, 5));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
    setError('');
  };

  const handleSubmit = async () => {
    if (!formData.agreeToTerms) {
      setError('Please agree to the terms and conditions');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create FormData for file uploads
      const submitFormData = new FormData();
      submitFormData.append('firstName', formData.firstName);
      submitFormData.append('lastName', formData.lastName);
      submitFormData.append('email', formData.email);
      submitFormData.append('phone', formData.phone);
      submitFormData.append('password', formData.password);
      submitFormData.append('specialty', formData.specialty);
      submitFormData.append('experienceYears', formData.experienceYears);
      
      // Professional info
      submitFormData.append('licenseNumber', formData.licenseNumber);
      submitFormData.append('qualifications', JSON.stringify(formData.qualifications));
      submitFormData.append('certifications', JSON.stringify(formData.certifications));
      submitFormData.append('specializations', JSON.stringify(formData.specializations));
      
      // Clinic details
      submitFormData.append('clinics', JSON.stringify(formData.clinics));
      
      // Documents
      if (formData.medicalLicense) {
        submitFormData.append('medicalLicense', formData.medicalLicense);
      }
      formData.degreeCertificates.forEach((file, index) => {
        submitFormData.append(`degreeCertificate_${index}`, file);
      });
      if (formData.idProof) {
        submitFormData.append('idProof', formData.idProof);
      }
      if (formData.clinicRegistration) {
        submitFormData.append('clinicRegistration', formData.clinicRegistration);
      }
      
      // Banking details
      submitFormData.append('bankAccountNumber', formData.bankAccountNumber);
      submitFormData.append('bankName', formData.bankName);
      submitFormData.append('ifscCode', formData.ifscCode);
      submitFormData.append('accountHolderName', formData.accountHolderName);
      submitFormData.append('panNumber', formData.panNumber);
      submitFormData.append('paymentPreferences', formData.paymentPreferences);

      const response = await apiClient.post('/doctors/register', submitFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.success) {
        alert('Registration successful! Your account is pending approval.');
        router.push('/doctors/login');
      } else {
        setError(response.error?.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      logger.error('Doctor registration error', err);
      setError(err.response?.data?.error?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const commonSpecializations = [
    'Cardiology', 'Dermatology', 'Pediatrics', 'Orthopedics', 'Neurology',
    'Gynecology', 'Psychiatry', 'General Medicine', 'Dentistry', 'Ophthalmology',
  ];
  const commonLanguages = ['English', 'Spanish', 'French', 'Hindi', 'Arabic', 'Mandarin'];

  return (
    <div className='min-h-screen bg-gradient-to-br from-primary-50 via-white to-neutral-50 py-12 px-4'>
      <div className='max-w-4xl mx-auto'>
        <div className='text-center mb-8'>
          <Link href='/' className='inline-flex items-center gap-2 mb-4'>
            <div className='w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center'>
              <span className='text-white font-bold text-2xl'>C</span>
            </div>
            <span className='text-2xl font-bold text-neutral-900'>ClinicTool</span>
          </Link>
          <h1 className='text-3xl font-bold text-neutral-900 mb-2'>Doctor Registration</h1>
          <p className='text-neutral-600'>Join our platform and connect with patients</p>
        </div>

        {/* Progress Steps */}
        <div className='mb-8'>
          <div className='flex items-center justify-between'>
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className='flex items-center flex-1'>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= s
                      ? 'bg-primary-600 text-white'
                      : 'bg-neutral-200 text-neutral-600'
                  }`}
                >
                  {s}
                </div>
                {s < 5 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      step > s ? 'bg-primary-600' : 'bg-neutral-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className='flex justify-between mt-2 text-sm text-neutral-600'>
            <span>Basic Info</span>
            <span>Professional</span>
            <span>Clinic Details</span>
            <span>Documents</span>
            <span>Banking</span>
          </div>
        </div>

        <Card className='p-8'>
          {error && (
            <div className='p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-6'>
              {error}
            </div>
          )}

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className='space-y-6'>
              <h2 className='text-2xl font-bold text-neutral-900'>Basic Information</h2>
              
              <div className='grid grid-cols-2 gap-4'>
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
              </div>

              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>Email *</label>
                <div className='flex gap-2'>
                  <Input
                    type='email'
                    value={formData.email}
                    onChange={(e) => {
                      handleInputChange('email', e.target.value);
                      handleInputChange('emailVerified', false);
                    }}
                    required
                    disabled={formData.emailVerified}
                    className='flex-1'
                  />
                  {!formData.emailVerified ? (
                    <Button
                      variant='secondary'
                      onClick={async () => {
                        try {
                          const response = await apiClient.post('/auth/send-verification-email', {
                            email: formData.email,
                          });
                          if (response.success) {
                            setOtpSent({ ...otpSent, email: true });
                            alert('Verification email sent!');
                          }
                        } catch (err) {
                          alert('Failed to send verification email');
                        }
                      }}
                    >
                      Verify
                    </Button>
                  ) : (
                    <Tag className='bg-green-100 text-green-800'>Verified ✓</Tag>
                  )}
                </div>
                {otpSent.email && !formData.emailVerified && (
                  <div className='mt-2 flex gap-2'>
                    <Input
                      type='text'
                      placeholder='Enter OTP'
                      value={emailOtp}
                      onChange={(e) => setEmailOtp(e.target.value)}
                      className='flex-1'
                    />
                    <Button
                      variant='primary'
                      size='sm'
                      onClick={async () => {
                        try {
                          const response = await apiClient.post('/auth/verify-email', {
                            email: formData.email,
                            otp: emailOtp,
                          });
                          if (response.success) {
                            handleInputChange('emailVerified', true);
                            alert('Email verified successfully!');
                          }
                        } catch (err) {
                          alert('Invalid OTP');
                        }
                      }}
                    >
                      Verify OTP
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  Phone Number *
                </label>
                <div className='flex gap-2'>
                  <Input
                    type='tel'
                    value={formData.phone}
                    onChange={(e) => {
                      handleInputChange('phone', e.target.value);
                      handleInputChange('phoneVerified', false);
                    }}
                    required
                    disabled={formData.phoneVerified}
                    className='flex-1'
                  />
                  {!formData.phoneVerified ? (
                    <Button
                      variant='secondary'
                      onClick={async () => {
                        try {
                          const response = await apiClient.post('/auth/send-otp', {
                            phone: formData.phone,
                          });
                          if (response.success) {
                            setOtpSent({ ...otpSent, phone: true });
                            alert('OTP sent to your phone!');
                          }
                        } catch (err) {
                          alert('Failed to send OTP');
                        }
                      }}
                    >
                      Verify
                    </Button>
                  ) : (
                    <Tag className='bg-green-100 text-green-800'>Verified ✓</Tag>
                  )}
                </div>
                {otpSent.phone && !formData.phoneVerified && (
                  <div className='mt-2 flex gap-2'>
                    <Input
                      type='text'
                      placeholder='Enter OTP'
                      value={phoneOtp}
                      onChange={(e) => setPhoneOtp(e.target.value)}
                      className='flex-1'
                    />
                    <Button
                      variant='primary'
                      size='sm'
                      onClick={async () => {
                        try {
                          const response = await apiClient.post('/auth/verify-otp', {
                            phone: formData.phone,
                            otp: phoneOtp,
                          });
                          if (response.success) {
                            handleInputChange('phoneVerified', true);
                            alert('Phone verified successfully!');
                          }
                        } catch (err) {
                          alert('Invalid OTP');
                        }
                      }}
                    >
                      Verify OTP
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>Password *</label>
                <Input
                  type='password'
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                  minLength={8}
                />
                <p className='text-xs text-neutral-500 mt-1'>Minimum 8 characters</p>
              </div>

              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  Confirm Password *
                </label>
                <Input
                  type='password'
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  required
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  Specialty *
                </label>
                <select
                  className='w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                  value={formData.specialty}
                  onChange={(e) => handleInputChange('specialty', e.target.value)}
                  required
                >
                  <option value=''>Select Specialty</option>
                  {commonSpecializations.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  Years of Experience *
                </label>
                <Input
                  type='number'
                  value={formData.experienceYears}
                  onChange={(e) => handleInputChange('experienceYears', e.target.value)}
                  min={0}
                  required
                />
              </div>

              <div className='flex justify-end'>
                <Button variant='primary' onClick={handleNext}>
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Professional Details */}
          {step === 2 && (
            <div className='space-y-6'>
              <h2 className='text-2xl font-bold text-neutral-900'>Professional Details</h2>
              
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  Medical Registration Number *
                </label>
                <Input
                  type='text'
                  value={formData.licenseNumber}
                  onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                  placeholder='e.g., MCI-12345'
                  required
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  Qualifications * (Add multiple)
                </label>
                <div className='space-y-3'>
                  {formData.qualifications.map((qual, index) => (
                    <div key={index} className='p-3 border border-neutral-200 rounded-lg'>
                      <div className='grid grid-cols-3 gap-3'>
                        <div>
                          <label className='block text-xs text-neutral-600 mb-1'>Degree</label>
                          <Input
                            type='text'
                            value={qual.degree || ''}
                            onChange={(e) => {
                              const quals = [...formData.qualifications];
                              quals[index] = { ...quals[index], degree: e.target.value };
                              handleInputChange('qualifications', quals);
                            }}
                            placeholder='e.g., MBBS, MD'
                          />
                        </div>
                        <div>
                          <label className='block text-xs text-neutral-600 mb-1'>University</label>
                          <Input
                            type='text'
                            value={qual.university || ''}
                            onChange={(e) => {
                              const quals = [...formData.qualifications];
                              quals[index] = { ...quals[index], university: e.target.value };
                              handleInputChange('qualifications', quals);
                            }}
                            placeholder='University name'
                          />
                        </div>
                        <div>
                          <label className='block text-xs text-neutral-600 mb-1'>Year</label>
                          <Input
                            type='number'
                            value={qual.year || ''}
                            onChange={(e) => {
                              const quals = [...formData.qualifications];
                              quals[index] = { ...quals[index], year: e.target.value };
                              handleInputChange('qualifications', quals);
                            }}
                            placeholder='Year'
                            min={1950}
                            max={new Date().getFullYear()}
                          />
                        </div>
                      </div>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => {
                          const quals = formData.qualifications.filter((_, i) => i !== index);
                          handleInputChange('qualifications', quals);
                        }}
                        className='mt-2 text-red-600'
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      handleInputChange('qualifications', [
                        ...formData.qualifications,
                        { degree: '', university: '', year: '' },
                      ]);
                    }}
                  >
                    + Add Qualification
                  </Button>
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  Certifications
                </label>
                <div className='space-y-3'>
                  {formData.certifications.map((cert, index) => (
                    <div key={index} className='p-3 border border-neutral-200 rounded-lg'>
                      <div className='grid grid-cols-3 gap-3'>
                        <div>
                          <label className='block text-xs text-neutral-600 mb-1'>Certification Name</label>
                          <Input
                            type='text'
                            value={cert.name || ''}
                            onChange={(e) => {
                              const certs = [...formData.certifications];
                              certs[index] = { ...certs[index], name: e.target.value };
                              handleInputChange('certifications', certs);
                            }}
                            placeholder='Certification name'
                          />
                        </div>
                        <div>
                          <label className='block text-xs text-neutral-600 mb-1'>Issuing Organization</label>
                          <Input
                            type='text'
                            value={cert.issuingOrganization || ''}
                            onChange={(e) => {
                              const certs = [...formData.certifications];
                              certs[index] = { ...certs[index], issuingOrganization: e.target.value };
                              handleInputChange('certifications', certs);
                            }}
                            placeholder='Organization'
                          />
                        </div>
                        <div>
                          <label className='block text-xs text-neutral-600 mb-1'>Year</label>
                          <Input
                            type='number'
                            value={cert.year || ''}
                            onChange={(e) => {
                              const certs = [...formData.certifications];
                              certs[index] = { ...certs[index], year: e.target.value };
                              handleInputChange('certifications', certs);
                            }}
                            placeholder='Year'
                            min={1950}
                            max={new Date().getFullYear()}
                          />
                        </div>
                      </div>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => {
                          const certs = formData.certifications.filter((_, i) => i !== index);
                          handleInputChange('certifications', certs);
                        }}
                        className='mt-2 text-red-600'
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      handleInputChange('certifications', [
                        ...formData.certifications,
                        { name: '', issuingOrganization: '', year: '' },
                      ]);
                    }}
                  >
                    + Add Certification
                  </Button>
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  Specializations * (Select at least one)
                </label>
                <div className='flex flex-wrap gap-2'>
                  {commonSpecializations.map((spec) => (
                    <Tag
                      key={spec}
                      className={`cursor-pointer ${
                        formData.specializations.includes(spec)
                          ? 'bg-primary-600 text-white'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      }`}
                      onClick={() => handleArrayChange('specializations', spec)}
                    >
                      {spec}
                    </Tag>
                  ))}
                </div>
                <Input
                  type='text'
                  placeholder='Or type custom specialization'
                  className='mt-2'
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      handleArrayChange('specializations', e.target.value.trim(), 'add');
                      e.target.value = '';
                    }
                  }}
                />
              </div>

              <div className='flex justify-between'>
                <Button variant='secondary' onClick={handleBack}>
                  Back
                </Button>
                <Button variant='primary' onClick={handleNext}>
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Clinic Details */}
          {step === 3 && (
            <div className='space-y-6'>
              <h2 className='text-2xl font-bold text-neutral-900'>Clinic Details</h2>
              
              <div className='space-y-4'>
                {formData.clinics.map((clinic, index) => (
                  <Card key={index} className='p-4'>
                    <div className='flex items-center justify-between mb-4'>
                      <h3 className='font-semibold text-neutral-900'>Clinic {index + 1}</h3>
                      {formData.clinics.length > 1 && (
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => {
                            const clinics = formData.clinics.filter((_, i) => i !== index);
                            handleInputChange('clinics', clinics);
                          }}
                          className='text-red-600'
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    
                    <div className='space-y-4'>
                      <div>
                        <label className='block text-sm font-medium text-neutral-700 mb-2'>
                          Clinic Name *
                        </label>
                        <Input
                          type='text'
                          value={clinic.name}
                          onChange={(e) => {
                            const clinics = [...formData.clinics];
                            clinics[index] = { ...clinics[index], name: e.target.value };
                            handleInputChange('clinics', clinics);
                          }}
                          required
                        />
                      </div>
                      
                      <div>
                        <label className='block text-sm font-medium text-neutral-700 mb-2'>
                          Address * (Click map to set location)
                        </label>
                        <textarea
                          className='w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                          rows={3}
                          value={clinic.address}
                          onChange={(e) => {
                            const clinics = [...formData.clinics];
                            clinics[index] = { ...clinics[index], address: e.target.value };
                            handleInputChange('clinics', clinics);
                          }}
                          required
                        />
                        <div className='mt-2'>
                          <iframe
                            src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY'}&q=${encodeURIComponent(clinic.address || '')}`}
                            width='100%'
                            height='200'
                            style={{ border: 0 }}
                            allowFullScreen
                            loading='lazy'
                            className='rounded-lg'
                          />
                          <p className='text-xs text-neutral-500 mt-1'>
                            Map will update based on address. You can also click on map to set coordinates.
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <label className='block text-sm font-medium text-neutral-700 mb-2'>
                          Working Hours *
                        </label>
                        <div className='space-y-2'>
                          {daysOfWeek.map((day) => (
                            <div key={day} className='flex items-center gap-3'>
                              <div className='w-24 capitalize text-sm text-neutral-700'>{day}</div>
                              <Input
                                type='time'
                                value={clinic.workingHours?.[day]?.start || '09:00'}
                                onChange={(e) => {
                                  const clinics = [...formData.clinics];
                                  if (!clinics[index].workingHours) clinics[index].workingHours = {};
                                  if (!clinics[index].workingHours[day]) clinics[index].workingHours[day] = {};
                                  clinics[index].workingHours[day].start = e.target.value;
                                  handleInputChange('clinics', clinics);
                                }}
                                className='flex-1'
                              />
                              <span className='text-neutral-500'>to</span>
                              <Input
                                type='time'
                                value={clinic.workingHours?.[day]?.end || '17:00'}
                                onChange={(e) => {
                                  const clinics = [...formData.clinics];
                                  if (!clinics[index].workingHours) clinics[index].workingHours = {};
                                  if (!clinics[index].workingHours[day]) clinics[index].workingHours[day] = {};
                                  clinics[index].workingHours[day].end = e.target.value;
                                  handleInputChange('clinics', clinics);
                                }}
                                className='flex-1'
                              />
                              <input
                                type='checkbox'
                                checked={clinic.workingHours?.[day]?.enabled || false}
                                onChange={(e) => {
                                  const clinics = [...formData.clinics];
                                  if (!clinics[index].workingHours) clinics[index].workingHours = {};
                                  if (!clinics[index].workingHours[day]) clinics[index].workingHours[day] = {};
                                  clinics[index].workingHours[day].enabled = e.target.checked;
                                  handleInputChange('clinics', clinics);
                                }}
                                className='icon icon-xs'
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <label className='block text-sm font-medium text-neutral-700 mb-2'>
                          Consultation Fee (₹) *
                        </label>
                        <Input
                          type='number'
                          value={clinic.consultationFee}
                          onChange={(e) => {
                            const clinics = [...formData.clinics];
                            clinics[index] = { ...clinics[index], consultationFee: e.target.value };
                            handleInputChange('clinics', clinics);
                          }}
                          min={0}
                          required
                        />
                      </div>
                    </div>
                  </Card>
                ))}
                
                <Button
                  variant='outline'
                  onClick={() => {
                    handleInputChange('clinics', [
                      ...formData.clinics,
                      { name: '', address: '', lat: '', lng: '', workingHours: {}, consultationFee: '' },
                    ]);
                  }}
                >
                  + Add Another Clinic Location
                </Button>
              </div>

              <div className='flex justify-between'>
                <Button variant='secondary' onClick={handleBack}>
                  Back
                </Button>
                <Button variant='primary' onClick={handleNext}>
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Documents Upload */}
          {step === 4 && (
            <div className='space-y-6'>
              <h2 className='text-2xl font-bold text-neutral-900'>Documents Upload</h2>
              <p className='text-sm text-neutral-600'>
                Please upload all required documents. Accepted formats: PDF, JPG, PNG (Max 5MB each)
              </p>
              
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  Medical License * (PDF/Image)
                </label>
                <div className='border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center'>
                  {formData.medicalLicense ? (
                    <div className='space-y-2'>
                      <p className='text-sm text-neutral-700'>{formData.medicalLicense.name}</p>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => handleInputChange('medicalLicense', null)}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <label className='cursor-pointer'>
                      <input
                        type='file'
                        className='hidden'
                        accept='.pdf,.jpg,.jpeg,.png'
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file && file.size <= 5 * 1024 * 1024) {
                            handleInputChange('medicalLicense', file);
                          } else {
                            alert('File size must be less than 5MB');
                          }
                        }}
                      />
                      <div className='space-y-2'>
                        <svg className='w-12 h-12 text-neutral-400 mx-auto' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' />
                        </svg>
                        <p className='text-sm text-neutral-600'>Click to upload or drag and drop</p>
                      </div>
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  Degree Certificates * (Upload multiple)
                </label>
                <div className='space-y-3'>
                  {formData.degreeCertificates.map((file, index) => (
                    <div key={index} className='flex items-center justify-between p-3 border border-neutral-200 rounded-lg'>
                      <p className='text-sm text-neutral-700'>{file.name}</p>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => {
                          const files = formData.degreeCertificates.filter((_, i) => i !== index);
                          handleInputChange('degreeCertificates', files);
                        }}
                        className='text-red-600'
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <label className='cursor-pointer'>
                    <input
                      type='file'
                      className='hidden'
                      accept='.pdf,.jpg,.jpeg,.png'
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files).filter(
                          (file) => file.size <= 5 * 1024 * 1024
                        );
                        if (files.length !== e.target.files.length) {
                          alert('Some files were too large (max 5MB each)');
                        }
                        handleInputChange('degreeCertificates', [
                          ...formData.degreeCertificates,
                          ...files,
                        ]);
                      }}
                    />
                    <Button variant='outline' size='sm' as='span'>
                      + Add Degree Certificate
                    </Button>
                  </label>
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  ID Proof * (PDF/Image)
                </label>
                <div className='border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center'>
                  {formData.idProof ? (
                    <div className='space-y-2'>
                      <p className='text-sm text-neutral-700'>{formData.idProof.name}</p>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => handleInputChange('idProof', null)}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <label className='cursor-pointer'>
                      <input
                        type='file'
                        className='hidden'
                        accept='.pdf,.jpg,.jpeg,.png'
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file && file.size <= 5 * 1024 * 1024) {
                            handleInputChange('idProof', file);
                          } else {
                            alert('File size must be less than 5MB');
                          }
                        }}
                      />
                      <div className='space-y-2'>
                        <svg className='w-12 h-12 text-neutral-400 mx-auto' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' />
                        </svg>
                        <p className='text-sm text-neutral-600'>Click to upload or drag and drop</p>
                      </div>
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  Clinic Registration (PDF/Image)
                </label>
                <div className='border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center'>
                  {formData.clinicRegistration ? (
                    <div className='space-y-2'>
                      <p className='text-sm text-neutral-700'>{formData.clinicRegistration.name}</p>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => handleInputChange('clinicRegistration', null)}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <label className='cursor-pointer'>
                      <input
                        type='file'
                        className='hidden'
                        accept='.pdf,.jpg,.jpeg,.png'
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file && file.size <= 5 * 1024 * 1024) {
                            handleInputChange('clinicRegistration', file);
                          } else {
                            alert('File size must be less than 5MB');
                          }
                        }}
                      />
                      <div className='space-y-2'>
                        <svg className='w-12 h-12 text-neutral-400 mx-auto' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' />
                        </svg>
                        <p className='text-sm text-neutral-600'>Click to upload or drag and drop (Optional)</p>
                      </div>
                    </label>
                  )}
                </div>
              </div>

              <div className='flex justify-between'>
                <Button variant='secondary' onClick={handleBack}>
                  Back
                </Button>
                <Button variant='primary' onClick={handleNext}>
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Banking Details */}
          {step === 5 && (
            <div className='space-y-6'>
              <h2 className='text-2xl font-bold text-neutral-900'>Banking Details</h2>
              <p className='text-sm text-neutral-600'>
                Provide your banking information for receiving payments from consultations
              </p>
              
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  Account Holder Name *
                </label>
                <Input
                  type='text'
                  value={formData.accountHolderName}
                  onChange={(e) => handleInputChange('accountHolderName', e.target.value)}
                  required
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  Bank Account Number *
                </label>
                <Input
                  type='text'
                  value={formData.bankAccountNumber}
                  onChange={(e) => handleInputChange('bankAccountNumber', e.target.value)}
                  required
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  Bank Name *
                </label>
                <Input
                  type='text'
                  value={formData.bankName}
                  onChange={(e) => handleInputChange('bankName', e.target.value)}
                  required
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  IFSC Code *
                </label>
                <Input
                  type='text'
                  value={formData.ifscCode}
                  onChange={(e) => handleInputChange('ifscCode', e.target.value.toUpperCase())}
                  placeholder='e.g., HDFC0001234'
                  required
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  PAN Number *
                </label>
                <Input
                  type='text'
                  value={formData.panNumber}
                  onChange={(e) => handleInputChange('panNumber', e.target.value.toUpperCase())}
                  placeholder='e.g., ABCDE1234F'
                  required
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  Payment Preferences *
                </label>
                <select
                  className='w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                  value={formData.paymentPreferences}
                  onChange={(e) => handleInputChange('paymentPreferences', e.target.value)}
                  required
                >
                  <option value='weekly'>Weekly</option>
                  <option value='bi-weekly'>Bi-Weekly</option>
                  <option value='monthly'>Monthly</option>
                </select>
                <p className='text-xs text-neutral-500 mt-1'>
                  How often you would like to receive payments
                </p>
              </div>

              <div className='p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
                <p className='text-sm text-yellow-800'>
                  <strong>Note:</strong> Your account will be pending admin verification after submission. 
                  You will receive an email notification once your account is approved.
                </p>
              </div>

              <div className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  id='terms'
                  checked={formData.agreeToTerms}
                  onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
                  className='icon icon-xs text-primary-600 rounded'
                  required
                />
                <label htmlFor='terms' className='text-sm text-neutral-700'>
                  I agree to the{' '}
                  <Link href='/terms' className='text-primary-600 hover:text-primary-700'>
                    Terms and Conditions
                  </Link>{' '}
                  and{' '}
                  <Link href='/privacy' className='text-primary-600 hover:text-primary-700'>
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <div className='flex justify-between'>
                <Button variant='secondary' onClick={handleBack}>
                  Back
                </Button>
                <Button variant='primary' onClick={handleSubmit} disabled={loading || !formData.agreeToTerms}>
                  {loading ? 'Submitting...' : 'Submit Registration'}
                </Button>
              </div>
            </div>
          )}
        </Card>

        <div className='mt-6 text-center'>
          <p className='text-sm text-neutral-600'>
            Already have an account?{' '}
            <Link href='/login' className='text-primary-600 hover:text-primary-700 font-medium'>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
