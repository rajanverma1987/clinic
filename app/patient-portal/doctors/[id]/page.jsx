'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { Tag } from '@/components/ui/Tag';
import { apiClient } from '@/lib/api/client';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { logger } from '@/lib/utils/logger.js';

export default function DoctorProfilePublicPage() {
  const router = useRouter();
  const params = useParams();
  const doctorId = params.id;
  const [loading, setLoading] = useState(true);
  const [doctor, setDoctor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [consultationType, setConsultationType] = useState('in-clinic'); // in-clinic, video
  const [reviewFilter, setReviewFilter] = useState('all'); // all, 5, 4, 3, 2, 1

  useEffect(() => {
    if (doctorId) {
      fetchDoctorProfile();
      fetchReviews();
      fetchAvailability();
    }
  }, [doctorId, selectedDate]);

  const fetchDoctorProfile = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/doctors/${doctorId}`);
      if (response.success && response.data) {
        setDoctor(response.data);
      }
    } catch (err) {
      logger.error('Failed to fetch doctor profile', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await apiClient.get(`/doctors/${doctorId}/reviews`);
      if (response.success) {
        setReviews(response.data || []);
      }
    } catch (err) {
      logger.error('Failed to fetch reviews', err);
    }
  };

  const fetchAvailability = async () => {
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await apiClient.get(
        `/appointments/slots?doctorId=${doctorId}&date=${dateStr}`
      );
      if (response.success) {
        setAvailableSlots(response.data?.slots || []);
      }
    } catch (err) {
      logger.error('Failed to fetch availability', err);
    }
  };

  const StarRating = ({ rating }) => {
    const fullStars = Math.floor(rating);
    return (
      <div className='flex items-center gap-1'>
        {Array.from({ length: 5 }).map((_, i) => (
          <svg
            key={i}
            className={`icon icon-sm ${
              i < fullStars ? 'text-yellow-400 fill-current' : 'text-neutral-300'
            }`}
            viewBox='0 0 20 20'
            fill='currentColor'
          >
            <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
          </svg>
        ))}
        <span className='ml-2 text-lg font-semibold'>{rating.toFixed(1)}</span>
        <span className='text-neutral-500'>({reviews.length} reviews)</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-neutral-50 flex items-center justify-center'>
        <Loader size='lg' />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className='min-h-screen bg-neutral-50 flex items-center justify-center'>
        <Card className='p-8 text-center'>
          <p className='text-neutral-500 mb-4'>Doctor not found</p>
          <Link href='/patient-portal/doctors'>
            <Button variant='primary'>Back to Search</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-neutral-50'>
      {/* Header */}
      <header className='bg-white shadow-sm border-b border-neutral-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
          <div className='flex items-center justify-between'>
            <Link href='/patient-portal' className='flex items-center gap-2'>
              <div className='w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center'>
                <span className='text-white font-bold text-xl'>C</span>
              </div>
              <span className='text-xl font-bold text-neutral-900'>ClinicTool</span>
            </Link>
            <div className='flex items-center gap-4'>
              <Link href='/patient-portal/login'>
                <Button variant='secondary' size='sm'>
                  Login
                </Button>
              </Link>
              <Link href='/patient-portal/register'>
                <Button variant='primary' size='sm'>
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Main Content */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Profile Header - Enhanced */}
            <Card className='p-8'>
              <div className='flex flex-col md:flex-row gap-8'>
                {/* Large Photo */}
                <div className='flex-shrink-0'>
                  <div className='w-48 h-48 md:w-56 md:h-56 bg-primary-100 rounded-2xl flex items-center justify-center overflow-hidden shadow-lg'>
                    {doctor.userId?.profilePhoto ? (
                      <img
                        src={doctor.userId.profilePhoto}
                        alt={`Dr. ${doctor.userId.firstName} ${doctor.userId.lastName}`}
                        className='w-full h-full object-cover'
                      />
                    ) : (
                      <span className='text-7xl font-bold text-primary-600'>
                        {doctor.userId?.firstName?.charAt(0) || 'D'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Doctor Info */}
                <div className='flex-1'>
                  <div className='flex items-start justify-between mb-4'>
                    <div className='flex-1'>
                      {/* Name with Verification Badge */}
                      <div className='flex items-center gap-3 mb-2'>
                        <h1 className='text-3xl md:text-4xl font-bold text-neutral-900'>
                          Dr. {doctor.userId?.firstName} {doctor.userId?.lastName}
                        </h1>
                        {doctor.isVerified && (
                          <span className='inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold'>
                            <svg className='icon icon-xs' fill='currentColor' viewBox='0 0 20 20'>
                              <path
                                fillRule='evenodd'
                                d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                                clipRule='evenodd'
                              />
                            </svg>
                            Verified
                          </span>
                        )}
                      </div>

                      {/* Qualifications */}
                      <div className='flex flex-wrap items-center gap-2 mb-3'>
                        {doctor.professional?.qualification && (
                          <span className='px-3 py-1 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium'>
                            {doctor.professional.qualification}
                          </span>
                        )}
                        {doctor.professional?.specialization?.map((spec, index) => (
                          <Tag key={index} className='bg-neutral-100 text-neutral-700'>
                            {spec}
                          </Tag>
                        ))}
                      </div>

                      {/* Specialty */}
                      <p className='text-lg text-neutral-700 font-medium mb-2'>
                        {doctor.professional?.specialization?.join(', ') || 'General Medicine'}
                      </p>

                      {/* Experience */}
                      {doctor.professional?.experienceYears && (
                        <p className='text-neutral-600 mb-3'>
                          <span className='font-semibold'>{doctor.professional.experienceYears} years</span> of
                          experience
                        </p>
                      )}

                      {/* Rating */}
                      <div className='mb-4'>
                        <StarRating rating={doctor.rating || 0} />
                      </div>

                      {/* Clinic Name and Address */}
                      <div className='space-y-1 mb-4'>
                        {doctor.clinicName && (
                          <p className='text-lg font-semibold text-neutral-900'>{doctor.clinicName}</p>
                        )}
                        <p className='text-neutral-600 flex items-start gap-2'>
                          <svg className='w-5 h-5 text-neutral-400 mt-0.5 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
                            />
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
                            />
                          </svg>
                          <span>
                            {doctor.clinicAddress ||
                              doctor.professional?.clinicAddress ||
                              doctor.departments?.[0]?.address ||
                              'Address not available'}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Book Appointment Button - Prominent */}
                  <div className='flex items-center gap-3'>
                    <Link href={`/patient-portal/appointments/book?doctorId=${doctorId}`} className='flex-1'>
                      <Button variant='primary' size='lg' className='w-full'>
                        Book Appointment
                      </Button>
                    </Link>
                    <Link href={`/patient-portal/appointments/book?doctorId=${doctorId}&type=video`}>
                      <Button variant='secondary' size='lg'>
                        Video Consultation
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>

            {/* Tabs */}
            <div className='border-b border-neutral-200'>
              <div className='flex gap-4 overflow-x-auto'>
                {['overview', 'experience', 'services', 'locations', 'business-hours', 'reviews', 'fees'].map(
                  (tab) => (
                    <button
                      key={tab}
                      className={`px-4 py-2 font-medium text-sm whitespace-nowrap capitalize ${
                        activeTab === tab
                          ? 'text-primary-600 border-b-2 border-primary-600'
                          : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab.replace('-', ' ')}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Tab Content */}
            <Card className='p-6'>
              {activeTab === 'overview' && (
                <div className='space-y-8'>
                  {/* About Doctor */}
                  <div>
                    <h3 className='text-xl font-bold text-neutral-900 mb-3 flex items-center gap-2'>
                      <svg className='w-5 h-5 text-primary-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                        />
                      </svg>
                      About Doctor
                    </h3>
                    <p className='text-neutral-700 leading-relaxed'>
                      {doctor.bio || doctor.professional?.bio || doctor.userId?.bio || 'No bio available.'}
                    </p>
                  </div>

                  {/* Education */}
                  <div>
                    <h3 className='text-xl font-bold text-neutral-900 mb-3 flex items-center gap-2'>
                      <svg className='w-5 h-5 text-primary-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M12 14l9-5-9-5-9 5 9 5z'
                        />
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z'
                        />
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M12 14v7M12 14l-9-5M12 14l9-5'
                        />
                      </svg>
                      Education
                    </h3>
                    <div className='space-y-3'>
                      {doctor.professional?.education && Array.isArray(doctor.professional.education) ? (
                        doctor.professional.education.map((edu, index) => (
                          <div key={index} className='p-4 bg-neutral-50 rounded-lg border border-neutral-200'>
                            <p className='font-semibold text-neutral-900'>{edu.degree || edu.qualification}</p>
                            {edu.university && <p className='text-neutral-600 text-sm'>{edu.university}</p>}
                            {edu.year && <p className='text-neutral-500 text-xs mt-1'>Year: {edu.year}</p>}
                          </div>
                        ))
                      ) : (
                        <div className='p-4 bg-neutral-50 rounded-lg border border-neutral-200'>
                          <p className='text-neutral-700'>
                            {doctor.professional?.qualification || 'Education details not specified'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Registrations/Certifications */}
                  <div>
                    <h3 className='text-xl font-bold text-neutral-900 mb-3 flex items-center gap-2'>
                      <svg className='w-5 h-5 text-primary-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z'
                        />
                      </svg>
                      Registrations & Certifications
                    </h3>
                    <div className='space-y-3'>
                      {doctor.professional?.certifications && Array.isArray(doctor.professional.certifications) &&
                      doctor.professional.certifications.length > 0 ? (
                        doctor.professional.certifications.map((cert, index) => (
                          <div key={index} className='p-4 bg-neutral-50 rounded-lg border border-neutral-200'>
                            <p className='font-semibold text-neutral-900'>{cert.name || cert}</p>
                            {cert.issuingAuthority && (
                              <p className='text-neutral-600 text-sm'>Issued by: {cert.issuingAuthority}</p>
                            )}
                            {cert.year && <p className='text-neutral-500 text-xs mt-1'>Year: {cert.year}</p>}
                            {cert.registrationNumber && (
                              <p className='text-neutral-500 text-xs'>Registration: {cert.registrationNumber}</p>
                            )}
                          </div>
                        ))
                      ) : doctor.professional?.registrationNumber ? (
                        <div className='p-4 bg-neutral-50 rounded-lg border border-neutral-200'>
                          <p className='text-neutral-700'>
                            <span className='font-semibold'>Registration Number:</span>{' '}
                            {doctor.professional.registrationNumber}
                          </p>
                        </div>
                      ) : (
                        <p className='text-neutral-500 italic'>No registrations or certifications listed.</p>
                      )}
                    </div>
                  </div>

                  {/* Memberships */}
                  <div>
                    <h3 className='text-xl font-bold text-neutral-900 mb-3 flex items-center gap-2'>
                      <svg className='w-5 h-5 text-primary-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
                        />
                      </svg>
                      Memberships
                    </h3>
                    <div className='space-y-2'>
                      {doctor.professional?.memberships && Array.isArray(doctor.professional.memberships) &&
                      doctor.professional.memberships.length > 0 ? (
                        doctor.professional.memberships.map((membership, index) => (
                          <div key={index} className='p-3 bg-neutral-50 rounded-lg border border-neutral-200'>
                            <p className='text-neutral-900 font-medium'>{membership.name || membership}</p>
                            {membership.organization && (
                              <p className='text-neutral-600 text-sm'>{membership.organization}</p>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className='text-neutral-500 italic'>No memberships listed.</p>
                      )}
                    </div>
                  </div>

                  {/* Awards and Recognitions */}
                  <div>
                    <h3 className='text-xl font-bold text-neutral-900 mb-3 flex items-center gap-2'>
                      <svg className='w-5 h-5 text-primary-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z'
                        />
                      </svg>
                      Awards & Recognitions
                    </h3>
                    <div className='space-y-3'>
                      {doctor.professional?.awards && Array.isArray(doctor.professional.awards) &&
                      doctor.professional.awards.length > 0 ? (
                        doctor.professional.awards.map((award, index) => (
                          <div key={index} className='p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200'>
                            <p className='font-semibold text-neutral-900'>{award.name || award}</p>
                            {award.organization && (
                              <p className='text-neutral-600 text-sm'>By: {award.organization}</p>
                            )}
                            {award.year && <p className='text-neutral-500 text-xs mt-1'>Year: {award.year}</p>}
                            {award.description && (
                              <p className='text-neutral-700 text-sm mt-2'>{award.description}</p>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className='text-neutral-500 italic'>No awards or recognitions listed.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'experience' && (
                <div className='space-y-8'>
                  {/* Years in Practice */}
                  <div>
                    <h3 className='text-xl font-bold text-neutral-900 mb-3 flex items-center gap-2'>
                      <svg className='w-5 h-5 text-primary-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                        />
                      </svg>
                      Years in Practice
                    </h3>
                    <div className='p-4 bg-primary-50 rounded-lg border border-primary-200'>
                      <p className='text-2xl font-bold text-primary-700'>
                        {doctor.professional?.experienceYears || 0} years
                      </p>
                      <p className='text-neutral-600 text-sm mt-1'>of professional experience</p>
                    </div>
                  </div>

                  {/* Current and Past Positions */}
                  <div>
                    <h3 className='text-xl font-bold text-neutral-900 mb-3 flex items-center gap-2'>
                      <svg className='w-5 h-5 text-primary-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
                        />
                      </svg>
                      Current & Past Positions
                    </h3>
                    <div className='space-y-4'>
                      {doctor.professional?.positions && Array.isArray(doctor.professional.positions) &&
                      doctor.professional.positions.length > 0 ? (
                        doctor.professional.positions.map((position, index) => (
                          <div key={index} className='p-4 bg-neutral-50 rounded-lg border border-neutral-200'>
                            <div className='flex items-start justify-between'>
                              <div className='flex-1'>
                                <p className='font-semibold text-neutral-900'>{position.title || position.role}</p>
                                {position.organization && (
                                  <p className='text-neutral-700 mt-1'>{position.organization}</p>
                                )}
                                {position.location && (
                                  <p className='text-neutral-600 text-sm mt-1'>📍 {position.location}</p>
                                )}
                                {position.startDate && (
                                  <p className='text-neutral-500 text-sm mt-2'>
                                    {position.startDate}
                                    {position.endDate ? ` - ${position.endDate}` : ' - Present'}
                                  </p>
                                )}
                                {position.description && (
                                  <p className='text-neutral-700 text-sm mt-2'>{position.description}</p>
                                )}
                              </div>
                              {position.isCurrent && (
                                <span className='ml-4 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold'>
                                  Current
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className='p-4 bg-neutral-50 rounded-lg border border-neutral-200'>
                          <p className='text-neutral-700'>
                            <span className='font-semibold'>Current Position:</span>{' '}
                            {doctor.professional?.qualification || 'Not specified'}
                          </p>
                          {doctor.clinicName && (
                            <p className='text-neutral-600 text-sm mt-1'>📍 {doctor.clinicName}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Special Interests */}
                  <div>
                    <h3 className='text-xl font-bold text-neutral-900 mb-3 flex items-center gap-2'>
                      <svg className='w-5 h-5 text-primary-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'
                        />
                      </svg>
                      Special Interests
                    </h3>
                    <div className='space-y-2'>
                      {doctor.professional?.specialInterests && Array.isArray(doctor.professional.specialInterests) &&
                      doctor.professional.specialInterests.length > 0 ? (
                        doctor.professional.specialInterests.map((interest, index) => (
                          <div key={index} className='p-3 bg-neutral-50 rounded-lg border border-neutral-200'>
                            <p className='text-neutral-900'>{interest}</p>
                          </div>
                        ))
                      ) : doctor.professional?.specialization ? (
                        <div className='flex flex-wrap gap-2'>
                          {doctor.professional.specialization.map((spec, index) => (
                            <Tag key={index} className='bg-primary-100 text-primary-800'>
                              {spec}
                            </Tag>
                          ))}
                        </div>
                      ) : (
                        <p className='text-neutral-500 italic'>No special interests listed.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'services' && (
                <div className='space-y-8'>
                  {/* Conditions Treated */}
                  <div>
                    <h3 className='text-xl font-bold text-neutral-900 mb-3 flex items-center gap-2'>
                      <svg className='w-5 h-5 text-primary-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                        />
                      </svg>
                      Conditions Treated
                    </h3>
                    <div className='space-y-2'>
                      {doctor.professional?.conditionsTreated && Array.isArray(doctor.professional.conditionsTreated) &&
                      doctor.professional.conditionsTreated.length > 0 ? (
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                          {doctor.professional.conditionsTreated.map((condition, index) => (
                            <div key={index} className='p-3 bg-neutral-50 rounded-lg border border-neutral-200 flex items-center gap-2'>
                              <svg className='w-5 h-5 text-primary-600 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  strokeWidth={2}
                                  d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                                />
                              </svg>
                              <span className='text-neutral-900'>{condition}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className='text-neutral-500 italic'>No specific conditions listed.</p>
                      )}
                    </div>
                  </div>

                  {/* Procedures Offered */}
                  <div>
                    <h3 className='text-xl font-bold text-neutral-900 mb-3 flex items-center gap-2'>
                      <svg className='w-5 h-5 text-primary-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z'
                        />
                      </svg>
                      Procedures Offered
                    </h3>
                    <div className='space-y-2'>
                      {doctor.professional?.proceduresOffered && Array.isArray(doctor.professional.proceduresOffered) &&
                      doctor.professional.proceduresOffered.length > 0 ? (
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                          {doctor.professional.proceduresOffered.map((procedure, index) => (
                            <div key={index} className='p-3 bg-neutral-50 rounded-lg border border-neutral-200 flex items-center gap-2'>
                              <svg className='w-5 h-5 text-primary-600 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  strokeWidth={2}
                                  d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                                />
                              </svg>
                              <span className='text-neutral-900'>{procedure}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className='text-neutral-500 italic'>No specific procedures listed.</p>
                      )}
                    </div>
                  </div>

                  {/* Treatment Approaches */}
                  <div>
                    <h3 className='text-xl font-bold text-neutral-900 mb-3 flex items-center gap-2'>
                      <svg className='w-5 h-5 text-primary-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'
                        />
                      </svg>
                      Treatment Approaches
                    </h3>
                    <div className='space-y-3'>
                      {doctor.professional?.treatmentApproaches && Array.isArray(doctor.professional.treatmentApproaches) &&
                      doctor.professional.treatmentApproaches.length > 0 ? (
                        doctor.professional.treatmentApproaches.map((approach, index) => (
                          <div key={index} className='p-4 bg-neutral-50 rounded-lg border border-neutral-200'>
                            <p className='text-neutral-900'>{approach}</p>
                          </div>
                        ))
                      ) : (
                        <p className='text-neutral-500 italic'>No specific treatment approaches listed.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'locations' && (
                <div className='space-y-6'>
                  <h3 className='text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2'>
                    <svg className='icon icon-md text-primary-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
                      />
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
                      />
                    </svg>
                    Clinic Locations
                  </h3>

                  {/* Multiple Clinic Locations */}
                  <div className='space-y-6'>
                    {doctor.departments && Array.isArray(doctor.departments) && doctor.departments.length > 0 ? (
                      doctor.departments.map((dept, index) => {
                        const locationAddress = dept.location || dept.address || doctor.clinicAddress || 'Address not available';
                        const locationName = dept.name || `Clinic Location ${index + 1}`;
                        
                        return (
                          <Card key={index} className='p-6'>
                            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                              {/* Location Info */}
                              <div className='space-y-4'>
                                <div>
                                  <h4 className='text-xl font-bold text-neutral-900 mb-2'>{locationName}</h4>
                                  <div className='space-y-2'>
                                    <p className='text-neutral-700 flex items-start gap-2'>
                                      <svg className='w-5 h-5 text-neutral-400 mt-0.5 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path
                                          strokeLinecap='round'
                                          strokeLinejoin='round'
                                          strokeWidth={2}
                                          d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
                                        />
                                        <path
                                          strokeLinecap='round'
                                          strokeLinejoin='round'
                                          strokeWidth={2}
                                          d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
                                        />
                                      </svg>
                                      <span>{locationAddress}</span>
                                    </p>
                                    {dept.phone && (
                                      <p className='text-neutral-700 flex items-center gap-2'>
                                        <svg className='w-5 h-5 text-neutral-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                          <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z'
                                          />
                                        </svg>
                                        <a href={`tel:${dept.phone}`} className='hover:text-primary-600'>
                                          {dept.phone}
                                        </a>
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Working Hours for this Location */}
                                {doctor.schedule?.slots && doctor.schedule.slots.length > 0 && (
                                  <div>
                                    <h5 className='font-semibold text-neutral-900 mb-2'>Working Hours</h5>
                                    <div className='space-y-1 text-sm'>
                                      {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                                        const slot = doctor.schedule.slots.find((s) => s.day?.toLowerCase() === day);
                                        return (
                                          <div key={day} className='flex items-center justify-between'>
                                            <span className='text-neutral-600 capitalize'>{day}:</span>
                                            <span className='text-neutral-900 font-medium'>
                                              {slot ? `${slot.startTime || '09:00'} - ${slot.endTime || '17:00'}` : 'Closed'}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* Get Directions Button */}
                                <a
                                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(locationAddress)}`}
                                  target='_blank'
                                  rel='noopener noreferrer'
                                >
                                  <Button variant='secondary' size='sm' className='w-full'>
                                    <svg className='w-4 h-4 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                      <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7'
                                      />
                                    </svg>
                                    Get Directions
                                  </Button>
                                </a>
                              </div>

                              {/* Map Integration */}
                              <div className='h-64 lg:h-full min-h-[250px] rounded-lg overflow-hidden border border-neutral-200'>
                                <iframe
                                  width='100%'
                                  height='100%'
                                  style={{ border: 0 }}
                                  loading='lazy'
                                  allowFullScreen
                                  referrerPolicy='no-referrer-when-downgrade'
                                  src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}&q=${encodeURIComponent(locationAddress)}`}
                                  title={`Map for ${locationName}`}
                                />
                              </div>
                            </div>
                          </Card>
                        );
                      })
                    ) : (
                      <Card className='p-6'>
                        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                          {/* Main Clinic Info */}
                          <div className='space-y-4'>
                            <div>
                              <h4 className='text-xl font-bold text-neutral-900 mb-2'>Main Clinic</h4>
                              <div className='space-y-2'>
                                <p className='text-neutral-700 flex items-start gap-2'>
                                  <svg className='w-5 h-5 text-neutral-400 mt-0.5 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path
                                      strokeLinecap='round'
                                      strokeLinejoin='round'
                                      strokeWidth={2}
                                      d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
                                    />
                                    <path
                                      strokeLinecap='round'
                                      strokeLinejoin='round'
                                      strokeWidth={2}
                                      d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
                                    />
                                  </svg>
                                  <span>
                                    {doctor.clinicAddress ||
                                      doctor.professional?.clinicAddress ||
                                      'Address not available'}
                                  </span>
                                </p>
                              </div>
                            </div>

                            {/* Working Hours */}
                            {doctor.schedule?.slots && doctor.schedule.slots.length > 0 && (
                              <div>
                                <h5 className='font-semibold text-neutral-900 mb-2'>Working Hours</h5>
                                <div className='space-y-1 text-sm'>
                                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                                    const slot = doctor.schedule.slots.find((s) => s.day?.toLowerCase() === day);
                                    return (
                                      <div key={day} className='flex items-center justify-between'>
                                        <span className='text-neutral-600 capitalize'>{day}:</span>
                                        <span className='text-neutral-900 font-medium'>
                                          {slot ? `${slot.startTime || '09:00'} - ${slot.endTime || '17:00'}` : 'Closed'}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Get Directions */}
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                                doctor.clinicAddress || doctor.professional?.clinicAddress || ''
                              )}`}
                              target='_blank'
                              rel='noopener noreferrer'
                            >
                              <Button variant='secondary' size='sm' className='w-full'>
                                <svg className='w-4 h-4 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                  <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7'
                                  />
                                </svg>
                                Get Directions
                              </Button>
                            </a>
                          </div>

                          {/* Map */}
                          <div className='h-64 lg:h-full min-h-[250px] rounded-lg overflow-hidden border border-neutral-200'>
                            <iframe
                              width='100%'
                              height='100%'
                              style={{ border: 0 }}
                              loading='lazy'
                              allowFullScreen
                              referrerPolicy='no-referrer-when-downgrade'
                              src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}&q=${encodeURIComponent(
                                doctor.clinicAddress || doctor.professional?.clinicAddress || ''
                              )}`}
                              title='Main Clinic Location'
                            />
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'business-hours' && (
                <div className='space-y-8'>
                  <h3 className='text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2'>
                    <svg className='icon icon-md text-primary-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                      />
                    </svg>
                    Business Hours & Availability
                  </h3>

                  {/* Consultation Duration */}
                  {doctor.schedule?.slots?.[0]?.slotDuration && (
                    <div className='p-4 bg-primary-50 rounded-lg border border-primary-200'>
                      <p className='text-sm text-neutral-600 mb-1'>Consultation Duration</p>
                      <p className='text-2xl font-bold text-primary-700'>
                        {doctor.schedule.slots[0].slotDuration} minutes
                      </p>
                    </div>
                  )}

                  {/* Weekly Schedule */}
                  <div>
                    <h4 className='text-lg font-semibold text-neutral-900 mb-4'>Weekly Schedule</h4>
                    {doctor.schedule?.slots && doctor.schedule.slots.length > 0 ? (
                      <div className='space-y-3'>
                        {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                          const slot = doctor.schedule.slots.find((s) => s.day?.toLowerCase() === day);
                          const isOpen = slot && slot.startTime && slot.endTime;
                          
                          return (
                            <div
                              key={day}
                              className={`flex items-center justify-between p-4 rounded-lg border ${
                                isOpen
                                  ? 'bg-green-50 border-green-200'
                                  : 'bg-neutral-50 border-neutral-200'
                              }`}
                            >
                              <div className='flex items-center gap-3'>
                                <span className='font-semibold text-neutral-900 capitalize w-24'>{day}</span>
                                {isOpen ? (
                                  <div className='flex items-center gap-2'>
                                    <span className='w-2 h-2 bg-green-500 rounded-full' />
                                    <span className='text-neutral-900 font-medium'>
                                      {slot.startTime} - {slot.endTime}
                                    </span>
                                  </div>
                                ) : (
                                  <div className='flex items-center gap-2'>
                                    <span className='w-2 h-2 bg-neutral-400 rounded-full' />
                                    <span className='text-neutral-500'>Closed</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : doctor.schedule?.workingDays && doctor.schedule.workingDays.length > 0 ? (
                      <div className='space-y-3'>
                        {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                          const isWorking = doctor.schedule.workingDays.includes(day);
                          return (
                            <div
                              key={day}
                              className={`flex items-center justify-between p-4 rounded-lg border ${
                                isWorking
                                  ? 'bg-green-50 border-green-200'
                                  : 'bg-neutral-50 border-neutral-200'
                              }`}
                            >
                              <span className='font-semibold text-neutral-900 capitalize'>{day}</span>
                              {isWorking ? (
                                <span className='text-neutral-700'>09:00 - 17:00</span>
                              ) : (
                                <span className='text-neutral-500'>Closed</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <Card className='p-6 text-center'>
                        <p className='text-neutral-500'>No schedule available.</p>
                      </Card>
                    )}
                  </div>

                  {/* Available Time Slots for Selected Date */}
                  {availableSlots.length > 0 && (
                    <div>
                      <h4 className='text-lg font-semibold text-neutral-900 mb-4'>
                        Available Time Slots for {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </h4>
                      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'>
                        {availableSlots.map((slot, index) => (
                          <Button
                            key={index}
                            variant='outline'
                            size='sm'
                            className='text-sm'
                            onClick={() => {
                              router.push(
                                `/patient-portal/appointments/book?doctorId=${doctorId}&date=${selectedDate.toISOString().split('T')[0]}&time=${slot}`
                              );
                            }}
                          >
                            {slot}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upcoming Leaves */}
                  {doctor.schedule?.leaves && doctor.schedule.leaves.length > 0 && (
                    <div className='p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
                      <h4 className='font-semibold text-neutral-900 mb-3 flex items-center gap-2'>
                        <svg className='icon icon-sm text-yellow-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                          />
                        </svg>
                        Upcoming Leaves
                      </h4>
                      <div className='space-y-2 text-sm text-neutral-700'>
                        {doctor.schedule.leaves
                          .filter((leave) => new Date(leave.to || leave.endDate) >= new Date())
                          .slice(0, 5)
                          .map((leave, index) => (
                            <div key={index} className='flex items-center justify-between'>
                              <span>
                                {new Date(leave.from || leave.startDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })}{' '}
                                -{' '}
                                {new Date(leave.to || leave.endDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                              {leave.reason && (
                                <span className='text-neutral-500 text-xs'>({leave.reason})</span>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className='space-y-6'>
                  <div className='flex items-center justify-between'>
                    <h3 className='text-xl font-bold text-neutral-900 flex items-center gap-2'>
                      <svg className='icon icon-md text-primary-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z'
                        />
                      </svg>
                      Patient Reviews ({reviews.length})
                    </h3>
                    
                    {/* Filter by Rating */}
                    <select
                      className='px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm'
                      value={reviewFilter}
                      onChange={(e) => setReviewFilter(e.target.value)}
                    >
                      <option value='all'>All Ratings</option>
                      <option value='5'>5 Stars</option>
                      <option value='4'>4 Stars</option>
                      <option value='3'>3 Stars</option>
                      <option value='2'>2 Stars</option>
                      <option value='1'>1 Star</option>
                    </select>
                  </div>

                  {/* Filtered Reviews */}
                  {(() => {
                    const filteredReviews =
                      reviewFilter === 'all'
                        ? reviews
                        : reviews.filter((r) => Math.round(r.rating || 0) === parseInt(reviewFilter, 10));
                    
                    return filteredReviews.length > 0 ? (
                      <div className='space-y-6'>
                        {filteredReviews.map((review) => (
                          <Card key={review._id} className='p-6'>
                            <div className='flex items-start justify-between mb-3'>
                              <div className='flex-1'>
                                <div className='flex items-center gap-2 mb-2'>
                                  <p className='font-semibold text-neutral-900'>
                                    {review.patientName || review.patientId?.firstName || 'Anonymous'}
                                  </p>
                                  {review.isVerified && (
                                    <span className='inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold'>
                                      <svg className='w-3 h-3' fill='currentColor' viewBox='0 0 20 20'>
                                        <path
                                          fillRule='evenodd'
                                          d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                                          clipRule='evenodd'
                                        />
                                      </svg>
                                      Verified Patient
                                    </span>
                                  )}
                                </div>
                                <StarRating rating={review.rating || 0} />
                              </div>
                              <span className='text-sm text-neutral-500'>
                                {new Date(review.createdAt || review.date || new Date()).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                            
                            <p className='text-neutral-700 mt-3 leading-relaxed'>{review.reviewText || review.text}</p>
                            
                            {review.treatmentType && (
                              <p className='text-sm text-neutral-500 mt-2'>
                                Treatment: {review.treatmentType}
                              </p>
                            )}

                            {/* Helpful/Not Helpful Votes */}
                            <div className='flex items-center gap-4 mt-4 pt-4 border-t border-neutral-200'>
                              <button
                                className='flex items-center gap-2 text-sm text-neutral-600 hover:text-primary-600 transition-colors'
                                onClick={() => {
                                  // TODO: Implement helpful vote API call
                                  console.log('Helpful clicked for review:', review._id);
                                }}
                              >
                                <svg className='icon icon-xs' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                  <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5'
                                  />
                                </svg>
                                Helpful ({review.helpfulCount || 0})
                              </button>
                              <button
                                className='flex items-center gap-2 text-sm text-neutral-600 hover:text-red-600 transition-colors'
                                onClick={() => {
                                  // TODO: Implement not helpful vote API call
                                  console.log('Not helpful clicked for review:', review._id);
                                }}
                              >
                                <svg className='icon icon-xs' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                  <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5'
                                  />
                                </svg>
                                Not Helpful
                              </button>
                            </div>

                            {/* Doctor Response (if any) */}
                            {review.doctorResponse && (
                              <div className='mt-4 p-4 bg-primary-50 rounded-lg border border-primary-200'>
                                <p className='text-sm font-semibold text-primary-900 mb-2'>Doctor's Response:</p>
                                <p className='text-neutral-700 text-sm'>{review.doctorResponse.text || review.doctorResponse}</p>
                                {review.doctorResponse.respondedAt && (
                                  <p className='text-xs text-neutral-500 mt-2'>
                                    {new Date(review.doctorResponse.respondedAt).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            )}
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Card className='p-8 text-center'>
                        <p className='text-neutral-500'>
                          {reviewFilter === 'all' ? 'No reviews yet.' : `No ${reviewFilter}-star reviews found.`}
                        </p>
                      </Card>
                    );
                  })()}
                </div>
              )}

              {activeTab === 'fees' && (
                <div className='space-y-8'>
                  <h3 className='text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2'>
                    <svg className='icon icon-md text-primary-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                      />
                    </svg>
                    Consultation Fees & Insurance
                  </h3>

                  {/* Fee Structure */}
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    {/* In-Clinic Consultation Fee */}
                    <Card className='p-6'>
                      <div className='flex items-center gap-3 mb-3'>
                        <div className='w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center'>
                          <svg className='icon icon-md text-primary-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
                            />
                          </svg>
                        </div>
                        <div className='flex-1'>
                          <h4 className='font-semibold text-neutral-900'>In-Clinic Consultation</h4>
                          <p className='text-2xl font-bold text-primary-600 mt-1'>
                            ${doctor.consultationFee || doctor.fees?.inClinic || 500}
                          </p>
                        </div>
                      </div>
                    </Card>

                    {/* Video Consultation Fee */}
                    <Card className='p-6'>
                      <div className='flex items-center gap-3 mb-3'>
                        <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center'>
                          <svg className='icon icon-md text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'
                            />
                          </svg>
                        </div>
                        <div className='flex-1'>
                          <h4 className='font-semibold text-neutral-900'>Video Consultation</h4>
                          <p className='text-2xl font-bold text-blue-600 mt-1'>
                            ${doctor.fees?.video || doctor.videoConsultationFee || 400}
                          </p>
                        </div>
                      </div>
                    </Card>

                    {/* Follow-up Fee */}
                    <Card className='p-6'>
                      <div className='flex items-center gap-3 mb-3'>
                        <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center'>
                          <svg className='w-6 h-6 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                            />
                          </svg>
                        </div>
                        <div className='flex-1'>
                          <h4 className='font-semibold text-neutral-900'>Follow-up Consultation</h4>
                          <p className='text-2xl font-bold text-green-600 mt-1'>
                            ${doctor.fees?.followUp || doctor.followUpFee || 300}
                          </p>
                          <p className='text-xs text-neutral-500 mt-1'>Within 30 days of previous visit</p>
                        </div>
                      </div>
                    </Card>

                    {/* Procedure Fees (if any) */}
                    {doctor.fees?.procedures && Array.isArray(doctor.fees.procedures) && doctor.fees.procedures.length > 0 && (
                      <Card className='p-6'>
                        <h4 className='font-semibold text-neutral-900 mb-3'>Procedure Fees</h4>
                        <div className='space-y-2'>
                          {doctor.fees.procedures.slice(0, 3).map((proc, index) => (
                            <div key={index} className='flex items-center justify-between text-sm'>
                              <span className='text-neutral-700'>{proc.name || proc}</span>
                              <span className='font-semibold text-neutral-900'>${proc.fee || proc}</span>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}
                  </div>

                  {/* Insurance Accepted */}
                  <div>
                    <h4 className='text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2'>
                      <svg className='w-5 h-5 text-primary-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
                        />
                      </svg>
                      Insurance Accepted
                    </h4>
                    <div className='space-y-3'>
                      {doctor.fees?.insuranceAccepted && Array.isArray(doctor.fees.insuranceAccepted) &&
                      doctor.fees.insuranceAccepted.length > 0 ? (
                        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'>
                          {doctor.fees.insuranceAccepted.map((insurance, index) => (
                            <div
                              key={index}
                              className='p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-center'
                            >
                              <p className='text-sm font-medium text-neutral-900'>{insurance}</p>
                            </div>
                          ))}
                        </div>
                      ) : doctor.insuranceAccepted && Array.isArray(doctor.insuranceAccepted) && doctor.insuranceAccepted.length > 0 ? (
                        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'>
                          {doctor.insuranceAccepted.map((insurance, index) => (
                            <div
                              key={index}
                              className='p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-center'
                            >
                              <p className='text-sm font-medium text-neutral-900'>{insurance}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Card className='p-6 text-center'>
                          <p className='text-neutral-500'>Insurance information not available.</p>
                          <p className='text-sm text-neutral-400 mt-2'>
                            Please contact the clinic directly for insurance coverage details.
                          </p>
                        </Card>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Booking Widget - Sticky */}
          <div className='lg:col-span-1'>
            <div className='sticky top-4'>
              <Card className='p-6'>
                <h3 className='text-lg font-bold text-neutral-900 mb-4'>Book Appointment</h3>
                
                {/* Date Picker */}
                <div className='mb-4'>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    Select Date
                  </label>
                  <input
                    type='date'
                    className='w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                    value={selectedDate.toISOString().split('T')[0]}
                    onChange={(e) => setSelectedDate(new Date(e.target.value))}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                {/* Time Slots */}
                <div className='mb-4'>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    Available Slots
                  </label>
                  {availableSlots.length > 0 ? (
                    <div className='space-y-4 max-h-64 overflow-y-auto'>
                      {/* Morning Slots */}
                      {availableSlots.filter((slot) => {
                        const hour = parseInt(slot.split(':')[0]);
                        return hour >= 6 && hour < 12;
                      }).length > 0 && (
                        <div>
                          <p className='text-xs font-semibold text-neutral-500 mb-2'>Morning</p>
                          <div className='grid grid-cols-3 gap-2'>
                            {availableSlots
                              .filter((slot) => {
                                const hour = parseInt(slot.split(':')[0]);
                                return hour >= 6 && hour < 12;
                              })
                              .map((slot, index) => (
                                <Button
                                  key={index}
                                  variant='outline'
                                  size='xs'
                                  onClick={() =>
                                    router.push(
                                      `/patient-portal/appointments/book?doctorId=${doctorId}&date=${selectedDate.toISOString().split('T')[0]}&time=${slot}&type=${consultationType}`
                                    )
                                  }
                                >
                                  {slot}
                                </Button>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Afternoon Slots */}
                      {availableSlots.filter((slot) => {
                        const hour = parseInt(slot.split(':')[0]);
                        return hour >= 12 && hour < 17;
                      }).length > 0 && (
                        <div>
                          <p className='text-xs font-semibold text-neutral-500 mb-2'>Afternoon</p>
                          <div className='grid grid-cols-3 gap-2'>
                            {availableSlots
                              .filter((slot) => {
                                const hour = parseInt(slot.split(':')[0]);
                                return hour >= 12 && hour < 17;
                              })
                              .map((slot, index) => (
                                <Button
                                  key={index}
                                  variant='outline'
                                  size='xs'
                                  onClick={() =>
                                    router.push(
                                      `/patient-portal/appointments/book?doctorId=${doctorId}&date=${selectedDate.toISOString().split('T')[0]}&time=${slot}&type=${consultationType}`
                                    )
                                  }
                                >
                                  {slot}
                                </Button>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Evening Slots */}
                      {availableSlots.filter((slot) => {
                        const hour = parseInt(slot.split(':')[0]);
                        return hour >= 17;
                      }).length > 0 && (
                        <div>
                          <p className='text-xs font-semibold text-neutral-500 mb-2'>Evening</p>
                          <div className='grid grid-cols-3 gap-2'>
                            {availableSlots
                              .filter((slot) => {
                                const hour = parseInt(slot.split(':')[0]);
                                return hour >= 17;
                              })
                              .map((slot, index) => (
                                <Button
                                  key={index}
                                  variant='outline'
                                  size='xs'
                                  onClick={() =>
                                    router.push(
                                      `/patient-portal/appointments/book?doctorId=${doctorId}&date=${selectedDate.toISOString().split('T')[0]}&time=${slot}&type=${consultationType}`
                                    )
                                  }
                                >
                                  {slot}
                                </Button>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className='p-4 bg-neutral-50 rounded-lg border border-neutral-200 text-center'>
                      <p className='text-sm text-neutral-500'>No slots available for this date</p>
                      <p className='text-xs text-neutral-400 mt-1'>Try selecting a different date</p>
                    </div>
                  )}
                </div>

                {/* Consultation Type Selector - Enhanced */}
                <div className='mb-6'>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    Consultation Type
                  </label>
                  <div className='grid grid-cols-2 gap-2'>
                    <button
                      onClick={() => setConsultationType('in-clinic')}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        consultationType === 'in-clinic'
                          ? 'border-primary-500 bg-primary-50 text-primary-700 font-semibold'
                          : 'border-neutral-200 bg-white text-neutral-700 hover:border-primary-300'
                      }`}
                    >
                      <div className='flex flex-col items-center gap-1'>
                        <svg className='icon icon-sm' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
                          />
                        </svg>
                        <span className='text-xs'>In-Clinic</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setConsultationType('video')}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        consultationType === 'video'
                          ? 'border-primary-500 bg-primary-50 text-primary-700 font-semibold'
                          : 'border-neutral-200 bg-white text-neutral-700 hover:border-primary-300'
                      }`}
                    >
                      <div className='flex flex-col items-center gap-1'>
                        <svg className='icon icon-sm' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'
                          />
                        </svg>
                        <span className='text-xs'>Video</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Instant Booking Button */}
                <Button
                  variant='primary'
                  size='lg'
                  className='w-full'
                  onClick={() =>
                    router.push(
                      `/patient-portal/appointments/book?doctorId=${doctorId}&type=${consultationType}${selectedDate ? `&date=${selectedDate.toISOString().split('T')[0]}` : ''}`
                    )
                  }
                >
                  <svg className='w-5 h-5 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 6v6m0 0v6m0-6h6m-6 0H6'
                    />
                  </svg>
                  Book Now
                </Button>

                {/* Quick Info */}
                <div className='mt-4 pt-4 border-t border-neutral-200 space-y-2 text-xs text-neutral-600'>
                  <div className='flex items-center justify-between'>
                    <span>Consultation Fee:</span>
                    <span className='font-semibold text-neutral-900'>
                      ${consultationType === 'video' ? doctor.fees?.video || 400 : doctor.consultationFee || 500}
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span>Duration:</span>
                    <span className='font-semibold text-neutral-900'>
                      {doctor.schedule?.slots?.[0]?.slotDuration || 30} min
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
