'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { apiClient } from '@/lib/api/client';
import { extractArrayData } from '@/lib/utils/api-response-extractor';
import { logger } from '@/lib/utils/logger';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PatientPortalHomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [insurance, setInsurance] = useState('');
  const [featuredDoctors, setFeaturedDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [testimonials, setTestimonials] = useState([]);
  const [loadingTestimonials, setLoadingTestimonials] = useState(false);
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (location) params.append('location', location);
    if (specialty) params.append('specialty', specialty);
    if (insurance) params.append('insurance', insurance);
    router.push(`/patient-portal/doctors?${params.toString()}`);
  };

  // Fetch featured doctors (top-rated, verified doctors)
  useEffect(() => {
    const fetchFeaturedDoctors = async () => {
      try {
        setLoadingDoctors(true);
        const response = await apiClient.get('/doctors/search?sortBy=rating&limit=6&minRating=4');
        if (response.success) {
          const doctorsData = extractArrayData(response);
          setFeaturedDoctors(Array.isArray(doctorsData) ? doctorsData.slice(0, 6) : []);
        }
      } catch (err) {
        logger.error('Failed to fetch featured doctors', err);
        setFeaturedDoctors([]);
      } finally {
        setLoadingDoctors(false);
      }
    };
    fetchFeaturedDoctors();
  }, []);

  // Fetch testimonials (top reviews)
  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        setLoadingTestimonials(true);
        // Fetch top reviews from all doctors (rating >= 4)
        const response = await apiClient.get(
          '/reviews?limit=10&minRating=4&sortBy=rating&sortOrder=desc'
        );
        if (response.success && response.data) {
          const reviewsData = response.data.reviews || extractArrayData(response);
          const formattedTestimonials = (Array.isArray(reviewsData) ? reviewsData : []).map(
            (review) => ({
              id: review._id || review.id,
              patientName: review.patientName || 'Anonymous',
              rating: review.rating || 5,
              reviewText: review.reviewText || '',
              treatmentType: review.treatmentType || 'General Consultation',
              date: review.createdAt || new Date(),
            })
          );
          setTestimonials(formattedTestimonials.slice(0, 6));
        } else {
          // Fallback to sample testimonials if API fails
          setTestimonials([
            {
              id: '1',
              patientName: 'Sarah Johnson',
              rating: 5,
              reviewText:
                'Excellent doctor! Very professional and caring. The consultation was thorough and the prescription was clear.',
              treatmentType: 'Cardiology Consultation',
              date: new Date(),
            },
            {
              id: '2',
              patientName: 'Michael Chen',
              rating: 5,
              reviewText:
                'Great experience! The doctor listened carefully to my concerns and provided helpful advice. Highly recommended!',
              treatmentType: 'Dermatology Consultation',
              date: new Date(),
            },
            {
              id: '3',
              patientName: 'Emily Davis',
              rating: 5,
              reviewText:
                "The best healthcare experience I've had. Quick appointment booking and excellent care. Thank you!",
              treatmentType: 'Pediatric Consultation',
              date: new Date(),
            },
          ]);
        }
      } catch (err) {
        logger.error('Failed to fetch testimonials', err);
        // Fallback to sample testimonials if API fails
        setTestimonials([
          {
            id: '1',
            patientName: 'Sarah Johnson',
            rating: 5,
            reviewText:
              'Excellent doctor! Very professional and caring. The consultation was thorough and the prescription was clear.',
            treatmentType: 'Cardiology Consultation',
            date: new Date(),
          },
          {
            id: '2',
            patientName: 'Michael Chen',
            rating: 5,
            reviewText:
              'Great experience! The doctor listened carefully to my concerns and provided helpful advice. Highly recommended!',
            treatmentType: 'Dermatology Consultation',
            date: new Date(),
          },
          {
            id: '3',
            patientName: 'Emily Davis',
            rating: 5,
            reviewText:
              "The best healthcare experience I've had. Quick appointment booking and excellent care. Thank you!",
            treatmentType: 'Pediatric Consultation',
            date: new Date(),
          },
        ]);
      } finally {
        setLoadingTestimonials(false);
      }
    };
    fetchTestimonials();
  }, []);

  // Auto-rotate testimonials carousel
  useEffect(() => {
    if (testimonials.length > 1) {
      const interval = setInterval(() => {
        setCurrentTestimonialIndex((prev) => (prev + 1) % testimonials.length);
      }, 5000); // Change every 5 seconds
      return () => clearInterval(interval);
    }
  }, [testimonials.length]);

  // Handle newsletter subscription
  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      const { showError } = await import('@/lib/utils/toast');
      showError('Please enter a valid email address');
      return;
    }

    try {
      setNewsletterSubmitting(true);
      // Newsletter subscription API not yet implemented
      const { showInfo } = await import('@/lib/utils/toast');
      showInfo('Newsletter subscription is not yet available.');
      setNewsletterEmail('');
    } catch (err) {
      logger.error('Failed to subscribe to newsletter', err);
      const { showError } = await import('@/lib/utils/toast');
      showError('Failed to subscribe. Please try again.');
    } finally {
      setNewsletterSubmitting(false);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-primary-50 via-white to-neutral-50'>
      {/* Header */}
      <header className='bg-white shadow-sm border-b border-neutral-200 sticky top-0 z-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
          <div className='flex items-center justify-between'>
            {/* Logo and Clinic Name */}
            <Link href='/patient-portal' className='flex items-center gap-2'>
              <div className='w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center'>
                <span className='text-white font-bold text-xl'>C</span>
              </div>
              <span className='text-xl font-bold text-neutral-900'>ClinicTool</span>
            </Link>

            {/* Navigation Links - Desktop */}
            <nav className='hidden md:flex items-center gap-6'>
              <Link
                href='/patient-portal/doctors'
                className='text-neutral-700 hover:text-primary-600 font-medium transition-colors'
              >
                Find Doctors
              </Link>
              <Link
                href='/patient-portal/doctors'
                className='text-neutral-700 hover:text-primary-600 font-medium transition-colors'
              >
                Specialties
              </Link>
              <Link
                href='/patient-portal/about'
                className='text-neutral-700 hover:text-primary-600 font-medium transition-colors'
              >
                About Us
              </Link>
              <Link
                href='/patient-portal/blog'
                className='text-neutral-700 hover:text-primary-600 font-medium transition-colors'
              >
                Blog
              </Link>
              <Link
                href='/patient-portal/contact'
                className='text-neutral-700 hover:text-primary-600 font-medium transition-colors'
              >
                Contact
              </Link>
            </nav>

            {/* Right Side: Emergency Number, Login, Sign Up */}
            <div className='flex items-center gap-4'>
              {/* Emergency Number */}
              <div className='hidden lg:flex items-center gap-2 text-red-600 font-semibold'>
                <svg className='icon icon-sm' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z'
                  />
                </svg>
                <a href='tel:108' className='hover:underline'>
                  Emergency: 108
                </a>
              </div>

              {/* Login and Sign Up Buttons */}
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

              {/* Mobile Menu Button */}
              <Button
                variant='ghost'
                size='sm'
                iconOnly
                className='md:hidden'
                onClick={() => {
                  // Mobile menu toggle will be handled separately if needed
                }}
              >
                <svg className='icon icon-md' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M4 6h16M4 12h16M4 18h16'
                  />
                </svg>
              </Button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          <nav className='md:hidden mt-4 pt-4 border-t border-neutral-200'>
            <div className='flex flex-col gap-3'>
              <Link
                href='/patient-portal/doctors'
                className='text-neutral-700 hover:text-primary-600 font-medium transition-colors py-2'
              >
                Find Doctors
              </Link>
              <Link
                href='/patient-portal/doctors'
                className='text-neutral-700 hover:text-primary-600 font-medium transition-colors py-2'
              >
                Specialties
              </Link>
              <Link
                href='/patient-portal/about'
                className='text-neutral-700 hover:text-primary-600 font-medium transition-colors py-2'
              >
                About Us
              </Link>
              <Link
                href='/patient-portal/blog'
                className='text-neutral-700 hover:text-primary-600 font-medium transition-colors py-2'
              >
                Blog
              </Link>
              <Link
                href='/patient-portal/contact'
                className='text-neutral-700 hover:text-primary-600 font-medium transition-colors py-2'
              >
                Contact
              </Link>
              {/* Emergency Number - Mobile */}
              <div className='flex items-center gap-2 text-red-600 font-semibold py-2'>
                <svg className='icon icon-sm' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z'
                  />
                </svg>
                <a href='tel:108' className='hover:underline'>
                  Emergency: 108
                </a>
              </div>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16'>
        <div className='text-center mb-12'>
          <h1 className='text-4xl md:text-5xl font-bold text-neutral-900 mb-4'>
            Find & Book Doctor Appointments Online
          </h1>
          <p className='text-xl text-neutral-600 max-w-2xl mx-auto'>
            Connect with verified doctors, book instant appointments, and manage your health records
            all in one place.
          </p>
        </div>

        {/* Search Bar */}
        <div className='max-w-5xl mx-auto'>
          <Card className='p-6 shadow-lg'>
            <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
              <div className='md:col-span-2'>
                <label className='block text-sm font-medium text-neutral-700 mb-1'>
                  Doctor Name or Specialty
                </label>
                <Input
                  type='text'
                  placeholder='Search by doctor name, specialty...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-1'>Location</label>
                <Input
                  type='text'
                  placeholder='City or Area'
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-1'>Specialty</label>
                <select
                  className='w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                >
                  <option value=''>All Specialties</option>
                  <option value='cardiology'>Cardiology</option>
                  <option value='dermatology'>Dermatology</option>
                  <option value='pediatrics'>Pediatrics</option>
                  <option value='orthopedics'>Orthopedics</option>
                  <option value='neurology'>Neurology</option>
                  <option value='general'>General Medicine</option>
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-1'>Insurance</label>
                <select
                  className='w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                  value={insurance}
                  onChange={(e) => setInsurance(e.target.value)}
                >
                  <option value=''>All Insurance</option>
                  <option value='blue-cross'>Blue Cross</option>
                  <option value='aetna'>Aetna</option>
                  <option value='cigna'>Cigna</option>
                  <option value='united-health'>United Health</option>
                  <option value='medicare'>Medicare</option>
                  <option value='medicaid'>Medicaid</option>
                  <option value='self-pay'>Self Pay</option>
                </select>
              </div>
            </div>
            <div className='mt-6 flex flex-col sm:flex-row gap-3 justify-center'>
              <Button
                variant='primary'
                size='lg'
                className='w-full sm:w-auto'
                onClick={handleSearch}
              >
                Search Doctors
              </Button>
              <Button
                variant='secondary'
                size='lg'
                className='w-full sm:w-auto'
                onClick={() => router.push('/patient-portal/doctors')}
              >
                Book Appointment
              </Button>
            </div>
          </Card>
        </div>

        {/* Trust Badges */}
        <div className='mt-12 flex flex-wrap items-center justify-center gap-8 text-neutral-600'>
          <div className='flex items-center gap-2'>
            <svg className='icon icon-md text-primary-600' fill='currentColor' viewBox='0 0 20 20'>
              <path
                fillRule='evenodd'
                d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                clipRule='evenodd'
              />
            </svg>
            <span className='font-medium'>Verified Doctors</span>
          </div>
          <div className='flex items-center gap-2'>
            <svg className='icon icon-md text-primary-600' fill='currentColor' viewBox='0 0 20 20'>
              <path d='M9 2a1 1 0 000 2h2a1 1 0 100-2H9z' />
              <path
                fillRule='evenodd'
                d='M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z'
                clipRule='evenodd'
              />
            </svg>
            <span className='font-medium'>Instant Booking</span>
          </div>
          <div className='flex items-center gap-2'>
            <svg className='icon icon-md text-primary-600' fill='currentColor' viewBox='0 0 20 20'>
              <path
                fillRule='evenodd'
                d='M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                clipRule='evenodd'
              />
            </svg>
            <span className='font-medium'>Secure & Private</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className='bg-white py-16'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <h2 className='text-3xl font-bold text-center text-neutral-900 mb-12'>
            Why Choose Our Platform?
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            {[
              {
                title: 'Instant Booking',
                description:
                  'Book appointments instantly with verified doctors. No waiting, no hassle.',
                icon: '📅',
              },
              {
                title: 'Verified Doctors',
                description: 'All doctors are verified and licensed. Your health is in safe hands.',
                icon: '✅',
              },
              {
                title: 'Digital Prescriptions',
                description:
                  'Receive digital prescriptions directly to your account. Easy to access anytime.',
                icon: '💊',
              },
              {
                title: 'Video Consultations',
                description:
                  'Consult with doctors from the comfort of your home via secure video calls.',
                icon: '📹',
              },
              {
                title: 'Lab Test Booking',
                description: 'Book lab tests and view results online. Track your health easily.',
                icon: '🧪',
              },
              {
                title: 'Medicine Delivery',
                description: 'Order medicines online and get them delivered to your doorstep.',
                icon: '🚚',
              },
            ].map((feature, index) => (
              <div key={index} className='text-center p-6'>
                <div className='text-4xl mb-4'>{feature.icon}</div>
                <h3 className='text-xl font-semibold text-neutral-900 mb-2'>{feature.title}</h3>
                <p className='text-neutral-600'>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className='py-16 bg-neutral-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <h2 className='text-3xl font-bold text-center text-neutral-900 mb-12'>How It Works</h2>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            {[
              {
                step: '1',
                title: 'Search for Doctors',
                description:
                  'Find doctors by specialty, location, or name. View their profiles and reviews.',
              },
              {
                step: '2',
                title: 'Book Appointment',
                description:
                  'Select a date and time that works for you. Confirm your booking instantly.',
              },
              {
                step: '3',
                title: 'Get Consultation',
                description:
                  'Visit the clinic or join a video call. Receive prescriptions and follow-up care.',
              },
            ].map((item, index) => (
              <div key={index} className='text-center'>
                <div className='w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4'>
                  <span className='text-white text-2xl font-bold'>{item.step}</span>
                </div>
                <h3 className='text-xl font-semibold text-neutral-900 mb-2'>{item.title}</h3>
                <p className='text-neutral-600'>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Specialties Section */}
      <section className='py-16'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <h2 className='text-3xl font-bold text-center text-neutral-900 mb-12'>
            Popular Specialties
          </h2>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            {[
              'Dentist',
              'Cardiologist',
              'Dermatologist',
              'Pediatrician',
              'Orthopedic',
              'Neurologist',
              'Gynecologist',
              'Psychiatrist',
            ].map((specialty, index) => (
              <Link
                key={index}
                href={`/patient-portal/doctors?specialty=${specialty.toLowerCase()}`}
                className='p-6 bg-white rounded-lg border border-neutral-200 hover:border-primary-300 hover:shadow-md transition-all text-center'
              >
                <div className='text-2xl mb-2'>🏥</div>
                <div className='font-medium text-neutral-900'>{specialty}</div>
              </Link>
            ))}
          </div>
          <div className='text-center mt-8'>
            <Link href='/patient-portal/doctors'>
              <Button variant='secondary'>View All Specialties</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Doctors Section */}
      <section className='py-16 bg-neutral-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <h2 className='text-3xl font-bold text-center text-neutral-900 mb-12'>
            Featured Doctors
          </h2>
          {loadingDoctors ? (
            <div className='flex justify-center py-12'>
              <Loader type='section' text={t('common.loading')} />
            </div>
          ) : featuredDoctors.length > 0 ? (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {featuredDoctors.map((doctor) => (
                <Card
                  key={doctor._id || doctor.id}
                  className='p-6 hover:shadow-lg transition-shadow'
                >
                  <div className='flex flex-col items-center text-center'>
                    {/* Doctor Photo */}
                    <div className='w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center mb-4 overflow-hidden'>
                      {doctor.profilePhoto ? (
                        <img
                          src={doctor.profilePhoto}
                          alt={doctor.name || 'Doctor'}
                          className='w-full h-full object-cover'
                        />
                      ) : (
                        <span className='text-3xl text-primary-600 font-bold'>
                          {(doctor.name || 'D').charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Doctor Name */}
                    <h3 className='text-xl font-semibold text-neutral-900 mb-1'>
                      {doctor.name || 'Dr. Name'}
                    </h3>

                    {/* Specialty */}
                    <p className='text-neutral-600 mb-2'>
                      {doctor.specialization || 'General Medicine'}
                    </p>

                    {/* Rating */}
                    <div className='flex items-center gap-2 mb-2'>
                      <div className='flex items-center'>
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`icon icon-sm ${
                              i < Math.floor(doctor.rating || 0)
                                ? 'text-yellow-400'
                                : 'text-neutral-300'
                            }`}
                            fill='currentColor'
                            viewBox='0 0 20 20'
                          >
                            <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                          </svg>
                        ))}
                      </div>
                      <span className='text-sm text-neutral-600'>
                        {doctor.rating ? doctor.rating.toFixed(1) : 'N/A'} (
                        {doctor.totalReviews || 0} reviews)
                      </span>
                    </div>

                    {/* Experience */}
                    {doctor.experienceYears && (
                      <p className='text-sm text-neutral-600 mb-2'>
                        {doctor.experienceYears} years of experience
                      </p>
                    )}

                    {/* Consultation Fee */}
                    <p className='text-lg font-semibold text-primary-600 mb-4'>
                      ${doctor.consultationFee || doctor.fees?.inClinic || 'N/A'}
                    </p>

                    {/* Book Now Button */}
                    <Link href={`/patient-portal/doctors/${doctor._id || doctor.id}`}>
                      <Button variant='primary' className='w-full'>
                        Book Now
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className='text-center py-12 text-neutral-600'>
              <p>No featured doctors available at the moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className='py-16 bg-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <h2 className='text-3xl font-bold text-center text-neutral-900 mb-12'>
            What Our Patients Say
          </h2>
          {loadingTestimonials ? (
            <div className='flex justify-center py-12'>
              <Loader type='section' text={t('common.loading')} />
            </div>
          ) : testimonials.length > 0 ? (
            <div className='relative'>
              {/* Testimonial Carousel */}
              <div className='overflow-hidden'>
                <div
                  className='flex transition-transform duration-500 ease-in-out'
                  style={{
                    transform: `translateX(-${currentTestimonialIndex * 100}%)`,
                  }}
                >
                  {testimonials.map((testimonial, index) => (
                    <div
                      key={testimonial.id}
                      className='w-full flex-shrink-0 px-4'
                      style={{ minWidth: '100%' }}
                    >
                      <Card className='p-8 text-center max-w-3xl mx-auto'>
                        {/* Star Rating */}
                        <div className='flex justify-center mb-4'>
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`icon icon-md ${
                                i < testimonial.rating ? 'text-yellow-400' : 'text-neutral-300'
                              }`}
                              fill='currentColor'
                              viewBox='0 0 20 20'
                            >
                              <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                            </svg>
                          ))}
                        </div>

                        {/* Review Text */}
                        <p className='text-lg text-neutral-700 mb-6 italic'>
                          "{testimonial.reviewText}"
                        </p>

                        {/* Patient Name and Treatment Type */}
                        <div>
                          <p className='font-semibold text-neutral-900 text-lg'>
                            {testimonial.patientName}
                          </p>
                          <p className='text-sm text-neutral-600 mt-1'>
                            {testimonial.treatmentType}
                          </p>
                        </div>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>

              {/* Carousel Navigation Dots */}
              {testimonials.length > 1 && (
                <div className='flex justify-center gap-2 mt-8'>
                  {testimonials.map((_, index) => (
                    <Button
                      key={index}
                      type='button'
                      variant='ghost'
                      size='xs'
                      iconOnly
                      onClick={() => setCurrentTestimonialIndex(index)}
                      className={`!min-h-0 !w-3 !h-3 !p-0 rounded-full transition-all ${
                        index === currentTestimonialIndex
                          ? '!bg-primary-600 !w-8 !h-3'
                          : '!bg-neutral-300 hover:!bg-neutral-400'
                      }`}
                      aria-label={`Go to testimonial ${index + 1}`}
                    />
                  ))}
                </div>
              )}

              {/* Navigation Arrows */}
              {testimonials.length > 1 && (
                <>
                  <Button
                    type='button'
                    variant='secondary'
                    size='sm'
                    iconOnly
                    onClick={() =>
                      setCurrentTestimonialIndex(
                        (prev) => (prev - 1 + testimonials.length) % testimonials.length
                      )
                    }
                    className='absolute left-0 top-1/2 -translate-y-1/2 !rounded-full !shadow-lg'
                    aria-label='Previous testimonial'
                  >
                    <svg
                      className='icon icon-md text-neutral-700'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M15 19l-7-7 7-7'
                      />
                    </svg>
                  </Button>
                  <Button
                    type='button'
                    variant='secondary'
                    size='sm'
                    iconOnly
                    onClick={() =>
                      setCurrentTestimonialIndex((prev) => (prev + 1) % testimonials.length)
                    }
                    className='absolute right-0 top-1/2 -translate-y-1/2 !rounded-full !shadow-lg'
                    aria-label='Next testimonial'
                  >
                    <svg
                      className='icon icon-md text-neutral-700'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M9 5l7 7-7 7'
                      />
                    </svg>
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className='text-center py-12 text-neutral-600'>
              <p>No testimonials available at the moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className='bg-neutral-200 text-neutral-800 border-t border-neutral-300 py-12'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-8'>
            <div>
              <h3 className='font-bold text-lg mb-4'>About</h3>
              <ul className='space-y-2 text-neutral-600'>
                <li>
                  <Link href='/patient-portal/about' className='hover:text-neutral-900'>
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href='/patient-portal/careers' className='hover:text-neutral-900'>
                    Careers
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className='font-bold text-lg mb-4'>Legal</h3>
              <ul className='space-y-2 text-neutral-600'>
                <li>
                  <Link href='/privacy' className='hover:text-neutral-900'>
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href='/terms' className='hover:text-neutral-900'>
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className='font-bold text-lg mb-4'>Support</h3>
              <ul className='space-y-2 text-neutral-600'>
                <li>
                  <Link href='/patient-portal/contact' className='hover:text-neutral-900'>
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href='/patient-portal/faq' className='hover:text-neutral-900'>
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className='font-bold text-lg mb-4'>Connect</h3>
              <div className='flex gap-4 mb-6'>
                <a
                  href='#'
                  className='text-neutral-600 hover:text-neutral-900 transition-colors'
                  aria-label='Facebook'
                >
                  <svg className='icon icon-md' fill='currentColor' viewBox='0 0 24 24'>
                    <path d='M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z' />
                  </svg>
                </a>
                <a
                  href='#'
                  className='text-neutral-600 hover:text-neutral-900 transition-colors'
                  aria-label='Twitter'
                >
                  <svg className='icon icon-md' fill='currentColor' viewBox='0 0 24 24'>
                    <path d='M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84' />
                  </svg>
                </a>
                <a
                  href='#'
                  className='text-neutral-600 hover:text-neutral-900 transition-colors'
                  aria-label='LinkedIn'
                >
                  <svg className='icon icon-md' fill='currentColor' viewBox='0 0 24 24'>
                    <path d='M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' />
                  </svg>
                </a>
                <a
                  href='#'
                  className='text-neutral-600 hover:text-neutral-900 transition-colors'
                  aria-label='Instagram'
                >
                  <svg className='icon icon-md' fill='currentColor' viewBox='0 0 24 24'>
                    <path d='M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' />
                  </svg>
                </a>
              </div>

              {/* Contact Info */}
              <div className='space-y-2 text-neutral-400 text-sm'>
                <p>Email: support@clinictool.com</p>
                <p>Phone: +1 (555) 123-4567</p>
                <p>Address: 123 Health St, Medical City, MC 12345</p>
              </div>
            </div>
          </div>

          {/* Newsletter Signup */}
          <div className='mt-12 pt-8 border-t border-neutral-800'>
            <div className='max-w-md mx-auto text-center'>
              <h3 className='font-bold text-lg mb-4'>Subscribe to Our Newsletter</h3>
              <p className='text-neutral-400 mb-4 text-sm'>
                Get health tips, appointment reminders, and special offers delivered to your inbox.
              </p>
              <form onSubmit={handleNewsletterSubmit} className='flex gap-2'>
                <Input
                  type='email'
                  placeholder='Enter your email'
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className='flex-1 bg-white border-neutral-300 text-neutral-900 placeholder:text-neutral-500'
                  required
                />
                <Button
                  type='submit'
                  variant='primary'
                  disabled={newsletterSubmitting || newsletterSuccess}
                >
                  {newsletterSubmitting
                    ? 'Subscribing...'
                    : newsletterSuccess
                      ? 'Subscribed!'
                      : 'Subscribe'}
                </Button>
              </form>
              {newsletterSuccess && (
                <p className='text-green-400 text-sm mt-2'>Thank you for subscribing!</p>
              )}
            </div>
          </div>
          <div className='mt-8 pt-8 border-t border-neutral-800 text-center text-neutral-400'>
            <p>&copy; 2026 ClinicTool. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
