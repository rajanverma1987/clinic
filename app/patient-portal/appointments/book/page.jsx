'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { apiClient } from '@/lib/api/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { logger } from '@/lib/utils/logger.js';

export default function BookAppointmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const doctorId = searchParams.get('doctorId');
  const selectedDate = searchParams.get('date');
  const selectedTime = searchParams.get('time');

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [doctor, setDoctor] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('self');
  const [uploadedReports, setUploadedReports] = useState([]);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [formData, setFormData] = useState({
    date: selectedDate || new Date().toISOString().split('T')[0],
    time: selectedTime || '',
    consultationType: 'in-clinic',
    patientName: '',
    age: '',
    gender: '',
    phone: '',
    email: '',
    reason: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    insuranceProvider: '',
    insurancePolicyNumber: '',
  });

  useEffect(() => {
    if (doctorId) {
      fetchDoctor();
      fetchSlots();
    }
    // Check if user is logged in
    checkAuthStatus();
  }, [doctorId, formData.date]);

  const checkAuthStatus = async () => {
    try {
      const response = await apiClient.get('/auth/me');
      if (response.success && response.data) {
        setIsLoggedIn(true);
        // Fetch family members if logged in
        fetchFamilyMembers();
        // Pre-fill user data
        if (response.data) {
          setFormData((prev) => ({
            ...prev,
            patientName: `${response.data.firstName || ''} ${response.data.lastName || ''}`.trim(),
            email: response.data.email || '',
            phone: response.data.phone || '',
            gender: response.data.gender || '',
          }));
        }
      }
    } catch (err) {
      setIsLoggedIn(false);
    }
  };

  const fetchFamilyMembers = async () => {
    try {
      const response = await apiClient.get('/patients/family-members');
      if (response.success) {
        setFamilyMembers(response.data || []);
      }
    } catch (err) {
      // Family members endpoint might not exist yet
      console.log('Family members not available');
    }
  };

  const fetchDoctor = async () => {
    try {
      const response = await apiClient.get(`/doctors/${doctorId}`);
      if (response.success) {
        setDoctor(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch doctor:', err);
    }
  };

  const fetchSlots = async () => {
    try {
      const response = await apiClient.get(
        `/appointments/slots?doctorId=${doctorId}&date=${formData.date}`
      );
      if (response.success) {
        setAvailableSlots(response.data?.slots || []);
        setAvailableDates(response.data?.availableDates || []);
      }
    } catch (err) {
      console.error('Failed to fetch slots:', err);
    }
  };

  // Fetch available dates for the next 30 days
  const fetchAvailableDates = async () => {
    try {
      const response = await apiClient.get(
        `/appointments/available-dates?doctorId=${doctorId}&days=30`
      );
      if (response.success) {
        setAvailableDates(response.data?.dates || []);
      }
    } catch (err) {
      // If endpoint doesn't exist, generate dates based on working days
      const dates = [];
      const today = new Date();
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        dates.push(date.toISOString().split('T')[0]);
      }
      setAvailableDates(dates);
    }
  };

  useEffect(() => {
    if (doctorId) {
      fetchAvailableDates();
    }
  }, [doctorId]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = files.map((file) => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      preview: URL.createObjectURL(file),
    }));
    setUploadedReports((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index) => {
    setUploadedReports((prev) => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const calculateAge = (dob) => {
    if (!dob) return '';
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age.toString();
  };

  const handleDOBChange = (dob) => {
    setDateOfBirth(dob);
    const age = calculateAge(dob);
    handleInputChange('age', age);
  };

  const sendOTP = async () => {
    try {
      setLoading(true);
      const response = await apiClient.post('/patient-portal/auth/send-otp', {
        phone: formData.phone,
        email: formData.email,
      });
      if (response.success) {
        setOtpSent(true);
        alert('OTP sent to your phone/email');
      }
    } catch (err) {
      alert('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    try {
      setLoading(true);
      const response = await apiClient.post('/patient-portal/auth/verify-otp', {
        phone: formData.phone,
        email: formData.email,
        otp: otp,
      });
      if (response.success) {
        setOtpVerified(true);
        setStep(3);
      } else {
        alert('Invalid OTP. Please try again.');
      }
    } catch (err) {
      alert('OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 1 && formData.date && formData.time) {
      setStep(2);
    } else if (step === 2) {
      // Validate patient details
      if (formData.patientName && formData.phone && formData.email) {
        if (!otpSent) {
          sendOTP();
        } else if (!otpVerified) {
          verifyOTP();
        } else {
          setStep(3);
        }
      } else {
        alert('Please fill in all required fields');
      }
    } else if (step === 3) {
      // Validate additional info
      setStep(4);
    } else if (step === 4) {
      // Payment step - proceed to confirmation
      setStep(5);
    }
  };

  const initiatePayment = async () => {
    try {
      setProcessingPayment(true);
      const amount =
        formData.consultationType === 'video'
          ? doctor?.fees?.video || doctor?.videoConsultationFee || doctor?.consultationFee || 500
          : doctor?.consultationFee || 500;

      // Create payment intent
      const response = await apiClient.post('/payments/initiate', {
        amount,
        currency: 'USD',
        paymentMethod: paymentMethod,
        appointmentData: {
          doctorId,
          date: formData.date,
          time: formData.time,
          consultationType: formData.consultationType,
          patientName: formData.patientName,
          patientEmail: formData.email,
          patientPhone: formData.phone,
        },
      });

      if (response.success && response.data?.paymentUrl) {
        // Redirect to payment gateway
        window.location.href = response.data.paymentUrl;
      } else if (response.success && response.data?.clientSecret) {
        // For Stripe, handle client-side payment
        // This would require Stripe.js integration
        alert('Payment processing will be handled after appointment booking');
        setProcessingPayment(false);
        return false;
      } else {
        alert('Failed to initiate payment. Please try again.');
        setProcessingPayment(false);
        return false;
      }
    } catch (err) {
      logger.error('Failed to initiate payment', err);
      alert('Payment initiation failed. Please try again.');
      setProcessingPayment(false);
      return false;
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // If payment method requires online payment, initiate it first
      if ((paymentMethod === 'card' || paymentMethod === 'upi') && !processingPayment) {
        const proceed = await initiatePayment();
        if (!proceed) {
          setLoading(false);
          return;
        }
        // Payment will redirect, so we don't continue here
        return;
      }
      
      // Calculate end time (30 minutes default)
      const startDateTime = new Date(`${formData.date}T${formData.time}:00`);
      const endDateTime = new Date(startDateTime.getTime() + (doctor?.schedule?.slots?.[0]?.slotDuration || 30) * 60000);
      
      const appointmentData = {
        doctorId,
        appointmentDate: formData.date,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        duration: doctor?.schedule?.slots?.[0]?.slotDuration || 30,
        type: formData.consultationType === 'video' ? 'telemedicine' : 'consultation',
        isTelemedicine: formData.consultationType === 'video',
        reason: formData.reason,
        // Patient details
        patientName: formData.patientName,
        patientAge: parseInt(formData.age),
        patientGender: formData.gender,
        patientPhone: formData.phone,
        patientEmail: formData.email,
        // Additional info
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        // Insurance
        insuranceProvider: formData.insuranceProvider || undefined,
        insurancePolicyNumber: formData.insurancePolicyNumber || undefined,
        // Payment
        paymentMethod: paymentMethod,
        consultationFee: formData.consultationType === 'video'
          ? doctor?.fees?.video || doctor?.videoConsultationFee || doctor?.consultationFee || 500
          : doctor?.consultationFee || 500,
        // Uploaded reports (would need to upload to server first)
        uploadedReports: uploadedReports.map((f) => f.name),
      };

      const response = await apiClient.post('/appointments', appointmentData);

      if (response.success) {
        router.push(`/patient-portal/appointments/confirm?appointmentId=${response.data.id || response.data._id}`);
      } else {
        alert(response.error?.message || 'Failed to book appointment. Please try again.');
      }
    } catch (err) {
      logger.error('Failed to book appointment', err);
      alert(err.response?.data?.error?.message || 'Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-neutral-50 py-8'>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Progress Steps - 5 Steps */}
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
            <span>Date & Time</span>
            <span>Patient Info</span>
            <span>Additional Info</span>
            <span>Payment</span>
            <span>Confirmation</span>
          </div>
        </div>

        <Card className='p-8'>
          {/* Step 1: Date & Time */}
          {step === 1 && (
            <div className='space-y-6'>
              <h2 className='text-2xl font-bold text-neutral-900'>Select Date & Time</h2>
              
              {doctor && (
                <div className='flex items-center gap-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200'>
                  <div className='w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center'>
                    {doctor.userId?.profilePicture ? (
                      <img
                        src={doctor.userId.profilePicture}
                        alt={doctor.userId.firstName}
                        className='w-full h-full rounded-lg object-cover'
                      />
                    ) : (
                      <span className='text-2xl font-bold text-primary-600'>
                        {doctor.userId?.firstName?.charAt(0) || 'D'}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className='font-semibold text-neutral-900'>
                      Dr. {doctor.userId?.firstName} {doctor.userId?.lastName}
                    </h3>
                    <p className='text-sm text-neutral-600'>
                      {doctor.professional?.specialization?.join(', ') || 'General Medicine'}
                    </p>
                    <p className='text-xs text-neutral-500 mt-1'>
                      {doctor.clinicAddress || doctor.professional?.clinicAddress || 'Clinic address'}
                    </p>
                  </div>
                </div>
              )}

              {/* Calendar View with Available Dates */}
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-3'>
                  Select Date
                </label>
                <div className='grid grid-cols-7 gap-2 mb-4'>
                  {/* Calendar Header */}
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className='text-center text-xs font-semibold text-neutral-600 py-2'>
                      {day}
                    </div>
                  ))}
                  {/* Calendar Days */}
                  {(() => {
                    const today = new Date();
                    const selectedDateObj = new Date(formData.date);
                    const firstDay = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), 1);
                    const lastDay = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth() + 1, 0);
                    const startDate = new Date(firstDay);
                    startDate.setDate(startDate.getDate() - startDate.getDay());
                    
                    const days = [];
                    for (let i = 0; i < 42; i++) {
                      const date = new Date(startDate);
                      date.setDate(startDate.getDate() + i);
                      const dateStr = date.toISOString().split('T')[0];
                      const isAvailable = availableDates.includes(dateStr) || date >= today;
                      const isSelected = dateStr === formData.date;
                      const isToday = dateStr === today.toISOString().split('T')[0];
                      const isCurrentMonth = date.getMonth() === selectedDateObj.getMonth();
                      
                      days.push(
                        <button
                          key={i}
                          type='button'
                          onClick={() => isAvailable && handleInputChange('date', dateStr)}
                          disabled={!isAvailable}
                          className={`h-10 rounded-lg text-sm transition-colors ${
                            isSelected
                              ? 'bg-primary-600 text-white font-semibold'
                              : isToday
                              ? 'bg-primary-100 text-primary-700 font-semibold'
                              : isAvailable && isCurrentMonth
                              ? 'bg-white text-neutral-900 hover:bg-primary-50 border border-neutral-200'
                              : isCurrentMonth
                              ? 'bg-neutral-50 text-neutral-400 cursor-not-allowed'
                              : 'bg-transparent text-neutral-300'
                          }`}
                        >
                          {date.getDate()}
                        </button>
                      );
                    }
                    return days;
                  })()}
                </div>
                {/* Alternative Date Picker */}
                <input
                  type='date'
                  className='w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Selected Slot Confirmation */}
              {formData.date && (
                <div className='p-3 bg-primary-50 border border-primary-200 rounded-lg'>
                  <p className='text-sm text-primary-700'>
                    <span className='font-semibold'>Selected Date:</span>{' '}
                    {new Date(formData.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}

              {/* Time Slots Grid - Grouped by Morning/Afternoon/Evening */}
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-3'>
                  Select Time Slot
                </label>
                {availableSlots.length > 0 ? (
                  <div className='space-y-4'>
                    {/* Morning Slots (6 AM - 12 PM) */}
                    {availableSlots.filter((slot) => {
                      const hour = parseInt(slot.split(':')[0]);
                      return hour >= 6 && hour < 12;
                    }).length > 0 && (
                      <div>
                        <p className='text-xs font-semibold text-neutral-500 mb-2 flex items-center gap-2'>
                          <svg className='icon icon-xs' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z'
                            />
                          </svg>
                          Morning
                        </p>
                        <div className='grid grid-cols-4 gap-2'>
                          {availableSlots
                            .filter((slot) => {
                              const hour = parseInt(slot.split(':')[0]);
                              return hour >= 6 && hour < 12;
                            })
                            .map((slot, index) => (
                              <Button
                                key={index}
                                variant={formData.time === slot ? 'primary' : 'outline'}
                                size='sm'
                                onClick={() => handleInputChange('time', slot)}
                              >
                                {slot}
                              </Button>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Afternoon Slots (12 PM - 5 PM) */}
                    {availableSlots.filter((slot) => {
                      const hour = parseInt(slot.split(':')[0]);
                      return hour >= 12 && hour < 17;
                    }).length > 0 && (
                      <div>
                        <p className='text-xs font-semibold text-neutral-500 mb-2 flex items-center gap-2'>
                          <svg className='icon icon-xs' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z'
                            />
                          </svg>
                          Afternoon
                        </p>
                        <div className='grid grid-cols-4 gap-2'>
                          {availableSlots
                            .filter((slot) => {
                              const hour = parseInt(slot.split(':')[0]);
                              return hour >= 12 && hour < 17;
                            })
                            .map((slot, index) => (
                              <Button
                                key={index}
                                variant={formData.time === slot ? 'primary' : 'outline'}
                                size='sm'
                                onClick={() => handleInputChange('time', slot)}
                              >
                                {slot}
                              </Button>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Evening Slots (5 PM onwards) */}
                    {availableSlots.filter((slot) => {
                      const hour = parseInt(slot.split(':')[0]);
                      return hour >= 17;
                    }).length > 0 && (
                      <div>
                        <p className='text-xs font-semibold text-neutral-500 mb-2 flex items-center gap-2'>
                          <svg className='icon icon-xs' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z'
                            />
                          </svg>
                          Evening
                        </p>
                        <div className='grid grid-cols-4 gap-2'>
                          {availableSlots
                            .filter((slot) => {
                              const hour = parseInt(slot.split(':')[0]);
                              return hour >= 17;
                            })
                            .map((slot, index) => (
                              <Button
                                key={index}
                                variant={formData.time === slot ? 'primary' : 'outline'}
                                size='sm'
                                onClick={() => handleInputChange('time', slot)}
                              >
                                {slot}
                              </Button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className='p-6 bg-neutral-50 rounded-lg border border-neutral-200 text-center'>
                    <p className='text-neutral-500'>No slots available for this date</p>
                    <p className='text-xs text-neutral-400 mt-1'>Please select a different date</p>
                  </div>
                )}
              </div>

              {/* Selected Slot Confirmation */}
              {formData.time && (
                <div className='p-4 bg-green-50 border border-green-200 rounded-lg'>
                  <p className='text-sm text-green-700 flex items-center gap-2'>
                    <svg className='icon icon-sm' fill='currentColor' viewBox='0 0 20 20'>
                      <path
                        fillRule='evenodd'
                        d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                        clipRule='evenodd'
                      />
                    </svg>
                    <span className='font-semibold'>Selected:</span> {formData.time} on{' '}
                    {new Date(formData.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}

              {/* Consultation Type */}
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  Consultation Type
                </label>
                <div className='grid grid-cols-2 gap-3'>
                  <button
                    type='button'
                    onClick={() => handleInputChange('consultationType', 'in-clinic')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      formData.consultationType === 'in-clinic'
                        ? 'border-primary-500 bg-primary-50 text-primary-700 font-semibold'
                        : 'border-neutral-300 hover:border-primary-300'
                    }`}
                  >
                    <div className='flex flex-col items-center gap-2'>
                      <svg className='icon icon-md' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
                        />
                      </svg>
                      <span>In-Clinic</span>
                    </div>
                  </button>
                  <button
                    type='button'
                    onClick={() => handleInputChange('consultationType', 'video')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      formData.consultationType === 'video'
                        ? 'border-primary-500 bg-primary-50 text-primary-700 font-semibold'
                        : 'border-neutral-300 hover:border-primary-300'
                    }`}
                  >
                    <div className='flex flex-col items-center gap-2'>
                      <svg className='icon icon-md' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'
                        />
                      </svg>
                      <span>Video</span>
                    </div>
                  </button>
                </div>
              </div>

              <div className='flex justify-end pt-4 border-t border-neutral-200'>
                <Button variant='primary' onClick={handleNext} disabled={!formData.time || !formData.date}>
                  Next: Patient Details
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Patient Details with OTP Verification */}
          {step === 2 && (
            <div className='space-y-6'>
              <h2 className='text-2xl font-bold text-neutral-900'>Patient Details</h2>

              {/* For Existing Users: Family Member Selection */}
              {isLoggedIn && familyMembers.length > 0 && (
                <div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
                  <label className='block text-sm font-medium text-neutral-700 mb-3'>
                    Select Patient *
                  </label>
                  <div className='space-y-2'>
                    <label className='flex items-center gap-3 p-3 bg-white rounded-lg border-2 cursor-pointer hover:border-primary-300 transition-colors'>
                      <input
                        type='radio'
                        name='patient'
                        value='self'
                        checked={selectedPatient === 'self'}
                        onChange={(e) => {
                          setSelectedPatient('self');
                          const user = JSON.parse(localStorage.getItem('user') || '{}');
                          setFormData((prev) => ({
                            ...prev,
                            patientName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                            email: user.email || '',
                            phone: user.phone || '',
                            gender: user.gender || '',
                            age: user.age || '',
                          }));
                        }}
                        className='icon icon-xs text-primary-600'
                      />
                      <div className='flex-1'>
                        <span className='font-semibold text-neutral-900'>Myself</span>
                        <p className='text-xs text-neutral-600'>
                          {JSON.parse(localStorage.getItem('user') || '{}').email || 'Your account'}
                        </p>
                      </div>
                    </label>
                    {familyMembers.map((member, index) => (
                      <label
                        key={index}
                        className='flex items-center gap-3 p-3 bg-white rounded-lg border-2 cursor-pointer hover:border-primary-300 transition-colors'
                      >
                        <input
                          type='radio'
                          name='patient'
                          value={member._id || member.id}
                          checked={selectedPatient === (member._id || member.id)}
                          onChange={(e) => {
                            setSelectedPatient(member._id || member.id);
                            setFormData((prev) => ({
                              ...prev,
                              patientName: `${member.firstName || ''} ${member.lastName || ''}`.trim(),
                              email: member.email || '',
                              phone: member.phone || '',
                              gender: member.gender || '',
                              age: member.age || calculateAge(member.dateOfBirth) || '',
                            }));
                          }}
                          className='icon icon-xs text-primary-600'
                        />
                        <div className='flex-1'>
                          <span className='font-semibold text-neutral-900'>
                            {member.firstName} {member.lastName}
                          </span>
                          <p className='text-xs text-neutral-600'>
                            {member.relationship || 'Family Member'} • {member.age || calculateAge(member.dateOfBirth) || 'N/A'} years
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                  <Button
                    type='button'
                    variant='secondary'
                    size='sm'
                    className='mt-3'
                    onClick={() => {
                      // TODO: Open add family member modal
                      alert('Add family member feature coming soon');
                    }}
                  >
                    + Add Family Member
                  </Button>
                </div>
              )}

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    Full Name *
                  </label>
                  <Input
                    type='text'
                    value={formData.patientName}
                    onChange={(e) => handleInputChange('patientName', e.target.value)}
                    placeholder='Enter patient name'
                    required
                    disabled={isLoggedIn && selectedPatient !== 'new'}
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    Date of Birth *
                  </label>
                  <Input
                    type='date'
                    value={dateOfBirth}
                    onChange={(e) => {
                      handleDOBChange(e.target.value);
                    }}
                    max={new Date().toISOString().split('T')[0]}
                    required
                    disabled={isLoggedIn && selectedPatient !== 'new'}
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>Age *</label>
                  <Input
                    type='number'
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    placeholder='Enter age'
                    required
                    disabled={isLoggedIn && selectedPatient !== 'new'}
                    min={0}
                    max={150}
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    Gender *
                  </label>
                  <select
                    className='w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                    value={formData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    required
                  >
                    <option value=''>Select</option>
                    <option value='male'>Male</option>
                    <option value='female'>Female</option>
                    <option value='other'>Other</option>
                  </select>
                </div>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    Phone Number *
                  </label>
                  <Input
                    type='tel'
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder='Enter phone number'
                    required
                    disabled={otpSent}
                  />
                </div>
                <div className='md:col-span-2'>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>Email *</label>
                  <Input
                    type='email'
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder='Enter email'
                    required
                    disabled={otpSent}
                  />
                </div>

                {/* OTP Verification Section */}
                {!otpSent && (
                  <div className='md:col-span-2'>
                    <Button
                      type='button'
                      variant='secondary'
                      onClick={sendOTP}
                      disabled={!formData.phone || !formData.email || loading}
                    >
                      Send OTP
                    </Button>
                  </div>
                )}

                {otpSent && !otpVerified && (
                  <div className='md:col-span-2 space-y-2'>
                    <label className='block text-sm font-medium text-neutral-700 mb-2'>
                      Enter OTP *
                    </label>
                    <div className='flex gap-2'>
                      <Input
                        type='text'
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder='Enter 6-digit OTP'
                        maxLength={6}
                        className='flex-1'
                      />
                      <Button
                        type='button'
                        variant='primary'
                        onClick={verifyOTP}
                        disabled={otp.length !== 6 || loading}
                      >
                        Verify
                      </Button>
                    </div>
                    <p className='text-xs text-neutral-500'>
                      OTP sent to {formData.phone} and {formData.email}
                    </p>
                    <Button
                      type='button'
                      variant='secondary'
                      size='sm'
                      onClick={sendOTP}
                      disabled={loading}
                    >
                      Resend OTP
                    </Button>
                  </div>
                )}

                {otpVerified && (
                  <div className='md:col-span-2 p-3 bg-green-50 border border-green-200 rounded-lg'>
                    <p className='text-sm text-green-700 flex items-center gap-2'>
                      <svg className='icon icon-sm' fill='currentColor' viewBox='0 0 20 20'>
                        <path
                          fillRule='evenodd'
                          d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                          clipRule='evenodd'
                        />
                      </svg>
                      Phone & Email verified
                    </p>
                  </div>
                )}

                <div className='md:col-span-2'>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    Problem Description / Reason for Visit *
                  </label>
                  <textarea
                    className='w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                    rows={4}
                    value={formData.reason}
                    onChange={(e) => handleInputChange('reason', e.target.value)}
                    placeholder='Describe your symptoms, medical history, or reason for visit in detail...'
                    required
                  />
                  <p className='text-xs text-neutral-500 mt-1'>
                    Please provide as much detail as possible to help the doctor prepare for your consultation.
                  </p>
                </div>

                {/* Upload Reports Section */}
                <div className='md:col-span-2'>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    Upload Medical Reports (Optional)
                  </label>
                  <div className='border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors'>
                    <input
                      type='file'
                      id='file-upload'
                      className='hidden'
                      multiple
                      accept='.pdf,.jpg,.jpeg,.png,.doc,.docx'
                      onChange={handleFileUpload}
                    />
                    <label
                      htmlFor='file-upload'
                      className='cursor-pointer flex flex-col items-center gap-2'
                    >
                      <svg className='w-8 h-8 text-neutral-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12'
                        />
                      </svg>
                      <span className='text-sm text-neutral-600'>
                        Click to upload or drag and drop
                      </span>
                      <span className='text-xs text-neutral-500'>
                        PDF, JPG, PNG, DOC, DOCX (Max 10MB per file)
                      </span>
                    </label>
                  </div>

                  {/* Uploaded Files List */}
                  {uploadedReports.length > 0 && (
                    <div className='mt-4 space-y-2'>
                      {uploadedReports.map((file, index) => (
                        <div
                          key={index}
                          className='flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200'
                        >
                          <div className='flex items-center gap-3 flex-1'>
                            <svg className='icon icon-sm text-neutral-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                              />
                            </svg>
                            <div className='flex-1 min-w-0'>
                              <p className='text-sm font-medium text-neutral-900 truncate'>{file.name}</p>
                              <p className='text-xs text-neutral-500'>
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <button
                            type='button'
                            onClick={() => removeFile(index)}
                            className='ml-2 p-1 text-red-600 hover:text-red-700'
                          >
                            <svg className='icon icon-sm' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M6 18L18 6M6 6l12 12'
                              />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className='flex justify-between'>
                <Button variant='secondary' onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  variant='primary'
                  onClick={handleNext}
                  disabled={!otpVerified || !formData.patientName || !formData.phone}
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Additional Information */}
          {step === 3 && (
            <div className='space-y-6'>
              <h2 className='text-2xl font-bold text-neutral-900'>Additional Information</h2>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='md:col-span-2'>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>Address</label>
                  <Input
                    type='text'
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder='Street address'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>City</label>
                  <Input
                    type='text'
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder='City'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>State</label>
                  <Input
                    type='text'
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    placeholder='State'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    ZIP Code
                  </label>
                  <Input
                    type='text'
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    placeholder='ZIP Code'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    Insurance Provider
                  </label>
                  <Input
                    type='text'
                    value={formData.insuranceProvider}
                    onChange={(e) => handleInputChange('insuranceProvider', e.target.value)}
                    placeholder='Insurance provider (optional)'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    Policy Number
                  </label>
                  <Input
                    type='text'
                    value={formData.insurancePolicyNumber}
                    onChange={(e) => handleInputChange('insurancePolicyNumber', e.target.value)}
                    placeholder='Policy number (optional)'
                  />
                </div>
              </div>

              <div className='flex justify-between'>
                <Button variant='secondary' onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button variant='primary' onClick={handleNext}>
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Payment */}
          {step === 4 && (
            <div className='space-y-6'>
              <h2 className='text-2xl font-bold text-neutral-900'>Payment</h2>

              {/* Fee Summary */}
              <Card className='p-6 bg-gradient-to-br from-primary-50 to-blue-50 border-2 border-primary-200'>
                <div className='flex justify-between items-center mb-2'>
                  <span className='text-lg font-semibold text-neutral-900'>Consultation Fee</span>
                  <span className='text-3xl font-bold text-primary-600'>
                    ${formData.consultationType === 'video'
                      ? doctor?.fees?.video || doctor?.videoConsultationFee || doctor?.consultationFee || 500
                      : doctor?.consultationFee || 500}
                  </span>
                </div>
                {formData.consultationType === 'video' && (
                  <p className='text-sm text-neutral-600 flex items-center gap-1'>
                    <svg className='icon icon-xs' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'
                      />
                    </svg>
                    Video consultation fee (includes secure video call)
                  </p>
                )}
                {formData.consultationType === 'in-clinic' && (
                  <p className='text-sm text-neutral-600 flex items-center gap-1'>
                    <svg className='icon icon-xs' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
                      />
                    </svg>
                    In-clinic consultation fee
                  </p>
                )}
              </Card>

              {/* Payment Method Selection */}
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-3'>
                  Select Payment Method *
                </label>
                <div className='grid grid-cols-2 gap-3'>
                  {/* Pay at Clinic */}
                  <button
                    type='button'
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      paymentMethod === 'cash'
                        ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                        : 'border-neutral-300 hover:border-primary-300'
                    }`}
                    onClick={() => setPaymentMethod('cash')}
                  >
                    <div className='flex items-center gap-3'>
                      <div className='w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center'>
                        <svg className='icon icon-md text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z'
                          />
                        </svg>
                      </div>
                      <div>
                        <div className='font-semibold text-neutral-900'>Pay at Clinic</div>
                        <div className='text-xs text-neutral-500 mt-1'>Cash or card at reception</div>
                      </div>
                    </div>
                  </button>

                  {/* Credit/Debit Card */}
                  <button
                    type='button'
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      paymentMethod === 'card'
                        ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                        : 'border-neutral-300 hover:border-primary-300'
                    }`}
                    onClick={() => setPaymentMethod('card')}
                  >
                    <div className='flex items-center gap-3'>
                      <div className='w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center'>
                        <svg className='icon icon-md text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'
                          />
                        </svg>
                      </div>
                      <div>
                        <div className='font-semibold text-neutral-900'>Card Payment</div>
                        <div className='text-xs text-neutral-500 mt-1'>Visa, Mastercard, Amex</div>
                      </div>
                    </div>
                  </button>

                  {/* UPI */}
                  <button
                    type='button'
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      paymentMethod === 'upi'
                        ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                        : 'border-neutral-300 hover:border-primary-300'
                    }`}
                    onClick={() => setPaymentMethod('upi')}
                  >
                    <div className='flex items-center gap-3'>
                      <div className='w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center'>
                        <svg className='icon icon-md text-purple-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z'
                          />
                        </svg>
                      </div>
                      <div>
                        <div className='font-semibold text-neutral-900'>UPI</div>
                        <div className='text-xs text-neutral-500 mt-1'>Google Pay, PhonePe, Paytm</div>
                      </div>
                    </div>
                  </button>

                  {/* Insurance */}
                  <button
                    type='button'
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      paymentMethod === 'insurance'
                        ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                        : 'border-neutral-300 hover:border-primary-300'
                    }`}
                    onClick={() => setPaymentMethod('insurance')}
                    disabled={!formData.insuranceProvider}
                  >
                    <div className='flex items-center gap-3'>
                      <div className='w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center'>
                        <svg className='icon icon-md text-indigo-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
                          />
                        </svg>
                      </div>
                      <div>
                        <div className='font-semibold text-neutral-900'>Insurance</div>
                        <div className='text-xs text-neutral-500 mt-1'>
                          {formData.insuranceProvider || 'Not configured'}
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Payment Gateway Integration Info */}
              {(paymentMethod === 'card' || paymentMethod === 'upi') && (
                <Card className='p-4 bg-blue-50 border border-blue-200'>
                  <div className='flex items-start gap-3'>
                    <svg className='icon icon-sm text-blue-600 flex-shrink-0 mt-0.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                      />
                    </svg>
                    <div>
                      <p className='text-sm font-semibold text-blue-900 mb-1'>Secure Payment</p>
                      <p className='text-xs text-blue-700'>
                        Your payment will be processed securely through{' '}
                        {process.env.NEXT_PUBLIC_PAYMENT_GATEWAY === 'razorpay' ? 'Razorpay' : 'Stripe'}. You'll be
                        redirected to the payment gateway for secure transaction processing.
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {paymentMethod === 'insurance' && !formData.insuranceProvider && (
                <Card className='p-4 bg-red-50 border border-red-200'>
                  <div className='flex items-start gap-3'>
                    <svg className='icon icon-sm text-red-600 flex-shrink-0 mt-0.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                      />
                    </svg>
                    <div>
                      <p className='text-sm font-semibold text-red-900 mb-1'>Insurance Not Configured</p>
                      <p className='text-xs text-red-700'>
                        Please provide insurance details in the previous step to use insurance payment.
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              <div className='flex justify-between pt-4 border-t border-neutral-200'>
                <Button variant='secondary' onClick={() => setStep(3)}>
                  Back
                </Button>
                <div className='flex gap-3'>
                  {/* Pay Now Button (for card/UPI) */}
                  {(paymentMethod === 'card' || paymentMethod === 'upi') && (
                    <Button
                      variant='primary'
                      size='lg'
                      onClick={initiatePayment}
                      disabled={processingPayment}
                    >
                      {processingPayment ? (
                        <>
                          <Loader size='sm' className='mr-2' />
                          Processing...
                        </>
                      ) : (
                        <>
                          <svg className='icon icon-sm mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'
                            />
                          </svg>
                          Pay Now
                        </>
                      )}
                    </Button>
                  )}
                  {/* Continue to Confirmation (for cash/insurance) */}
                  <Button
                    variant='primary'
                    size='lg'
                    onClick={handleNext}
                    disabled={
                      (paymentMethod === 'insurance' && !formData.insuranceProvider) ||
                      processingPayment
                    }
                  >
                    {paymentMethod === 'cash' || paymentMethod === 'insurance'
                      ? 'Continue to Confirmation'
                      : 'Skip Payment (Pay Later)'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Final Confirmation */}
          {step === 5 && (
            <div className='space-y-6'>
              <div className='text-center'>
                <h2 className='text-2xl font-bold text-neutral-900 mb-2'>Review & Confirm Booking</h2>
                <p className='text-neutral-600'>Please review all details before confirming your appointment</p>
              </div>

              <div className='space-y-4'>
                {/* Doctor Details */}
                {doctor && (
                  <Card className='p-6'>
                    <h3 className='text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2'>
                      <svg className='icon icon-sm text-primary-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                        />
                      </svg>
                      Doctor Details
                    </h3>
                    <div className='flex items-start gap-4'>
                      <div className='w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                        {doctor.userId?.profilePicture ? (
                          <img
                            src={doctor.userId.profilePicture}
                            alt={doctor.userId.firstName}
                            className='w-full h-full rounded-lg object-cover'
                          />
                        ) : (
                          <span className='text-2xl font-bold text-primary-600'>
                            {doctor.userId?.firstName?.charAt(0) || 'D'}
                          </span>
                        )}
                      </div>
                      <div className='flex-1'>
                        <p className='font-semibold text-neutral-900 text-lg'>
                          Dr. {doctor.userId?.firstName} {doctor.userId?.lastName}
                        </p>
                        <p className='text-sm text-neutral-600 mt-1'>
                          {doctor.professional?.specialization?.join(', ') || 'General Medicine'}
                        </p>
                        {doctor.professional?.experienceYears && (
                          <p className='text-xs text-neutral-500 mt-1'>
                            {doctor.professional.experienceYears} years of experience
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                )}

                {/* Appointment Details */}
                <Card className='p-6'>
                  <h3 className='text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2'>
                    <svg className='icon icon-sm text-primary-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                      />
                    </svg>
                    Appointment Details
                  </h3>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                      <p className='text-xs text-neutral-500 mb-1'>Date</p>
                      <p className='font-semibold text-neutral-900'>
                        {new Date(formData.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div>
                      <p className='text-xs text-neutral-500 mb-1'>Time</p>
                      <p className='font-semibold text-neutral-900'>{formData.time}</p>
                    </div>
                    <div>
                      <p className='text-xs text-neutral-500 mb-1'>Consultation Type</p>
                      <p className='font-semibold text-neutral-900 capitalize'>
                        {formData.consultationType === 'in-clinic' ? 'In-Clinic Consultation' : 'Video Consultation'}
                      </p>
                    </div>
                    <div>
                      <p className='text-xs text-neutral-500 mb-1'>Duration</p>
                      <p className='font-semibold text-neutral-900'>
                        {doctor?.schedule?.slots?.[0]?.slotDuration || 30} minutes
                      </p>
                    </div>
                    {formData.consultationType === 'in-clinic' && (
                      <div className='md:col-span-2'>
                        <p className='text-xs text-neutral-500 mb-1'>Location</p>
                        <p className='font-semibold text-neutral-900'>
                          {doctor?.clinicAddress || doctor?.professional?.clinicAddress || 'Clinic address'}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Patient Details */}
                <Card className='p-6'>
                  <h3 className='text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2'>
                    <svg className='icon icon-sm text-primary-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                      />
                    </svg>
                    Patient Information
                  </h3>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                      <p className='text-xs text-neutral-500 mb-1'>Full Name</p>
                      <p className='font-semibold text-neutral-900'>{formData.patientName}</p>
                    </div>
                    <div>
                      <p className='text-xs text-neutral-500 mb-1'>Age</p>
                      <p className='font-semibold text-neutral-900'>{formData.age} years</p>
                    </div>
                    <div>
                      <p className='text-xs text-neutral-500 mb-1'>Gender</p>
                      <p className='font-semibold text-neutral-900 capitalize'>{formData.gender}</p>
                    </div>
                    <div>
                      <p className='text-xs text-neutral-500 mb-1'>Phone</p>
                      <p className='font-semibold text-neutral-900'>{formData.phone}</p>
                    </div>
                    {formData.email && (
                      <div>
                        <p className='text-xs text-neutral-500 mb-1'>Email</p>
                        <p className='font-semibold text-neutral-900'>{formData.email}</p>
                      </div>
                    )}
                    {formData.reason && (
                      <div className='md:col-span-2'>
                        <p className='text-xs text-neutral-500 mb-1'>Reason for Visit</p>
                        <p className='text-sm text-neutral-700'>{formData.reason}</p>
                      </div>
                    )}
                    {uploadedReports.length > 0 && (
                      <div className='md:col-span-2'>
                        <p className='text-xs text-neutral-500 mb-2'>Uploaded Reports</p>
                        <div className='flex flex-wrap gap-2'>
                          {uploadedReports.map((file, index) => (
                            <span
                              key={index}
                              className='px-2 py-1 bg-neutral-100 text-neutral-700 rounded text-xs'
                            >
                              {file.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Fees Breakdown */}
                <Card className='p-6 bg-primary-50 border-2 border-primary-200'>
                  <h3 className='text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2'>
                    <svg className='icon icon-sm text-primary-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                      />
                    </svg>
                    Fees Breakdown
                  </h3>
                  <div className='space-y-3'>
                    <div className='flex items-center justify-between'>
                      <span className='text-neutral-700'>
                        {formData.consultationType === 'video' ? 'Video Consultation Fee' : 'In-Clinic Consultation Fee'}
                      </span>
                      <span className='font-semibold text-neutral-900'>
                        ${formData.consultationType === 'video'
                          ? doctor?.fees?.video || doctor?.videoConsultationFee || doctor?.consultationFee || 500
                          : doctor?.consultationFee || 500}
                      </span>
                    </div>
                    {formData.insuranceProvider && (
                      <div className='flex items-center justify-between text-sm'>
                        <span className='text-neutral-600'>Insurance: {formData.insuranceProvider}</span>
                        <span className='text-green-600 font-semibold'>Covered</span>
                      </div>
                    )}
                    <div className='pt-3 border-t border-primary-200 flex items-center justify-between'>
                      <span className='text-lg font-bold text-neutral-900'>Total Amount</span>
                      <span className='text-2xl font-bold text-primary-600'>
                        ${formData.consultationType === 'video'
                          ? doctor?.fees?.video || doctor?.videoConsultationFee || doctor?.consultationFee || 500
                          : doctor?.consultationFee || 500}
                      </span>
                    </div>
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-neutral-600'>Payment Method</span>
                      <span className='font-semibold text-neutral-900 capitalize'>{paymentMethod}</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Terms & Conditions */}
              <Card className='p-6 bg-yellow-50 border border-yellow-200'>
                <div className='flex items-start gap-3'>
                  <input
                    type='checkbox'
                    id='terms'
                    className='icon icon-sm text-primary-600 rounded mt-0.5 flex-shrink-0'
                    required
                  />
                  <label htmlFor='terms' className='text-sm text-neutral-700 cursor-pointer'>
                    <span className='font-semibold'>I agree to the terms and conditions</span>
                    <br />
                    <span className='text-xs text-neutral-600'>
                      By confirming, I acknowledge that I have read and agree to the cancellation policy, privacy
                      policy, and terms of service. I understand that appointment fees are non-refundable if
                      cancelled less than 24 hours before the scheduled time.
                    </span>
                  </label>
                </div>
              </Card>

              <div className='flex justify-between pt-4 border-t border-neutral-200'>
                <Button variant='secondary' onClick={() => setStep(4)}>
                  Back
                </Button>
                <Button variant='primary' size='lg' onClick={handleSubmit} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader size='sm' className='mr-2' />
                      Booking Appointment...
                    </>
                  ) : (
                    <>
                      <svg className='icon icon-sm mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M5 13l4 4L19 7'
                        />
                      </svg>
                      Confirm & Book Appointment
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
