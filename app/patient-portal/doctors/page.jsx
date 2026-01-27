'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { Tag } from '@/components/ui/Tag';
import { apiClient } from '@/lib/api/client';
import { extractArrayData } from '@/lib/utils/api-response-extractor';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DoctorSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    location: searchParams.get('location') || '',
    specialty: searchParams.get('specialty') || '',
    gender: searchParams.get('gender') || '',
    rating: searchParams.get('rating') || '',
    feeRange: searchParams.get('feeRange') || '',
    feeMin: searchParams.get('feeMin') || '',
    feeMax: searchParams.get('feeMax') || '',
    experience: searchParams.get('experience') || '',
    languages: searchParams.get('languages') || '',
    availability: searchParams.get('availability') || '',
    consultationType: searchParams.get('consultationType') || '',
  });
  const [sortBy, setSortBy] = useState('relevance');
  const [viewMode, setViewMode] = useState('list'); // list, map
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDoctors, setTotalDoctors] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [filters, sortBy]);

  useEffect(() => {
    fetchDoctors();
  }, [filters, sortBy, currentPage]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.location) params.append('location', filters.location);
      if (filters.specialty) params.append('specialty', filters.specialty);
      if (filters.gender) params.append('gender', filters.gender);
      if (filters.rating) params.append('minRating', filters.rating);
      if (filters.experience) params.append('minExperience', filters.experience);
      if (filters.feeMin) params.append('feeMin', filters.feeMin);
      if (filters.feeMax) params.append('feeMax', filters.feeMax);
      if (filters.languages) params.append('languages', filters.languages);
      if (filters.consultationType) params.append('consultationType', filters.consultationType);
      if (sortBy) params.append('sortBy', sortBy);
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());

      const response = await apiClient.get(`/doctors/search?${params.toString()}`);
      
      if (response.success) {
        const doctorsData = extractArrayData(response);
        setDoctors(Array.isArray(doctorsData) ? doctorsData : []);
        
        // Set pagination info if available
        if (response.data?.pagination) {
          setTotalPages(response.data.pagination.totalPages || 1);
          setTotalDoctors(response.data.pagination.total || doctorsData.length);
        } else {
          // Estimate pagination if not provided
          setTotalDoctors(doctorsData.length);
          setTotalPages(Math.ceil(doctorsData.length / itemsPerPage) || 1);
        }
      }
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const StarRating = ({ rating }) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    return (
      <div className='flex items-center gap-1'>
        {Array.from({ length: 5 }).map((_, i) => (
          <svg
            key={i}
            className={`icon icon-xs ${
              i < fullStars
                ? 'text-yellow-400 fill-current'
                : i === fullStars && hasHalfStar
                ? 'text-yellow-400 fill-current opacity-50'
                : 'text-neutral-300'
            }`}
            viewBox='0 0 20 20'
            fill='currentColor'
          >
            <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
          </svg>
        ))}
        <span className='ml-1 text-sm text-neutral-600'>{rating.toFixed(1)}</span>
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
        <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
          {/* Filters Sidebar */}
          <div className='lg:col-span-1'>
            <Card className='p-4 sticky top-4'>
              <h2 className='text-lg font-bold text-neutral-900 mb-4'>Filters</h2>
              
              <div className='space-y-4'>
                {/* Location */}
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    Location
                  </label>
                  <Input
                    type='text'
                    placeholder='City or area'
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                  />
                </div>

                {/* Specialty */}
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    Specialty
                  </label>
                  <select
                    className='w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                    value={filters.specialty}
                    onChange={(e) => handleFilterChange('specialty', e.target.value)}
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

                {/* Gender */}
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>Gender</label>
                  <select
                    className='w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                    value={filters.gender}
                    onChange={(e) => handleFilterChange('gender', e.target.value)}
                  >
                    <option value=''>Any</option>
                    <option value='male'>Male</option>
                    <option value='female'>Female</option>
                  </select>
                </div>

                {/* Rating */}
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    Minimum Rating
                  </label>
                  <select
                    className='w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                    value={filters.rating}
                    onChange={(e) => handleFilterChange('rating', e.target.value)}
                  >
                    <option value=''>Any</option>
                    <option value='4'>4+ Stars</option>
                    <option value='3'>3+ Stars</option>
                  </select>
                </div>

                {/* Fee Range Slider */}
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    Consultation Fee Range
                  </label>
                  <div className='space-y-2'>
                    <div className='flex gap-2'>
                      <Input
                        type='number'
                        placeholder='Min'
                        value={filters.feeMin}
                        onChange={(e) => handleFilterChange('feeMin', e.target.value)}
                        className='w-full'
                      />
                      <Input
                        type='number'
                        placeholder='Max'
                        value={filters.feeMax}
                        onChange={(e) => handleFilterChange('feeMax', e.target.value)}
                        className='w-full'
                      />
                    </div>
                    <div className='flex items-center gap-2 text-xs text-neutral-600'>
                      <span>${filters.feeMin || '0'}</span>
                      <span>-</span>
                      <span>${filters.feeMax || '1000+'}</span>
                    </div>
                  </div>
                </div>

                {/* Experience */}
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    Experience
                  </label>
                  <select
                    className='w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                    value={filters.experience}
                    onChange={(e) => handleFilterChange('experience', e.target.value)}
                  >
                    <option value=''>Any</option>
                    <option value='5'>5+ Years</option>
                    <option value='10'>10+ Years</option>
                    <option value='15'>15+ Years</option>
                    <option value='20'>20+ Years</option>
                  </select>
                </div>

                {/* Languages */}
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    Languages Spoken
                  </label>
                  <select
                    className='w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                    value={filters.languages}
                    onChange={(e) => handleFilterChange('languages', e.target.value)}
                  >
                    <option value=''>Any Language</option>
                    <option value='english'>English</option>
                    <option value='spanish'>Spanish</option>
                    <option value='french'>French</option>
                    <option value='german'>German</option>
                    <option value='chinese'>Chinese</option>
                    <option value='hindi'>Hindi</option>
                    <option value='arabic'>Arabic</option>
                    <option value='portuguese'>Portuguese</option>
                  </select>
                </div>

                {/* Consultation Type */}
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    Consultation Type
                  </label>
                  <select
                    className='w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                    value={filters.consultationType}
                    onChange={(e) => handleFilterChange('consultationType', e.target.value)}
                  >
                    <option value=''>Both</option>
                    <option value='in-clinic'>In-Clinic</option>
                    <option value='video'>Video</option>
                  </select>
                </div>

                {/* Availability */}
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    Availability
                  </label>
                  <select
                    className='w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                    value={filters.availability}
                    onChange={(e) => handleFilterChange('availability', e.target.value)}
                  >
                    <option value=''>Any</option>
                    <option value='today'>Today</option>
                    <option value='tomorrow'>Tomorrow</option>
                    <option value='this-week'>This Week</option>
                  </select>
                </div>
              </div>
            </Card>
          </div>

          {/* Results */}
          <div className='lg:col-span-3'>
            {/* Search and Sort */}
            <div className='flex items-center justify-between mb-6'>
              <div className='flex-1 max-w-md'>
                <Input
                  type='text'
                  placeholder='Search doctors...'
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && fetchDoctors()}
                />
              </div>
              <div className='flex items-center gap-4'>
                <select
                  className='px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value='relevance'>Relevance</option>
                  <option value='rating'>Rating</option>
                  <option value='experience'>Experience</option>
                  <option value='fees-low'>Fees (Low to High)</option>
                  <option value='fees-high'>Fees (High to Low)</option>
                </select>
                <div className='flex gap-2'>
                  <Button
                    variant={viewMode === 'list' ? 'primary' : 'secondary'}
                    size='sm'
                    onClick={() => setViewMode('list')}
                  >
                    List
                  </Button>
                  <Button
                    variant={viewMode === 'map' ? 'primary' : 'secondary'}
                    size='sm'
                    onClick={() => setViewMode('map')}
                  >
                    Map
                  </Button>
                </div>
              </div>
            </div>

            {/* Results Count */}
            <div className='mb-4 text-neutral-600'>
              Found {totalDoctors} doctor{totalDoctors !== 1 ? 's' : ''}
              {viewMode === 'list' && totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
            </div>

            {/* Map View */}
            {viewMode === 'map' && (
              <Card className='p-4'>
                <div className='h-[600px] w-full relative rounded-lg overflow-hidden border border-neutral-200'>
                  {doctors.length > 0 ? (
                    <div className='h-full w-full relative'>
                      {/* Google Maps Embed - Note: Requires NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env */}
                      <iframe
                        width='100%'
                        height='100%'
                        style={{ border: 0 }}
                        loading='lazy'
                        allowFullScreen
                        referrerPolicy='no-referrer-when-downgrade'
                        src={`https://www.google.com/maps/embed/v1/view?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}&center=40.7128,-74.0060&zoom=12`}
                        title='Doctors Map View'
                      />
                      {/* Doctor Markers Overlay - Clickable list of doctors */}
                      <div className='absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg max-h-[500px] overflow-y-auto w-80'>
                        <h3 className='font-bold text-neutral-900 mb-3'>Doctors on Map ({doctors.length})</h3>
                        <div className='space-y-2'>
                          {doctors.map((doctor) => (
                            <div
                              key={doctor._id}
                              className='p-3 border border-neutral-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 cursor-pointer transition-colors'
                              onClick={() => router.push(`/patient-portal/doctors/${doctor._id}`)}
                            >
                              <div className='flex items-start gap-2'>
                                <div className='w-2 h-2 bg-primary-600 rounded-full mt-2 flex-shrink-0' />
                                <div className='flex-1 min-w-0'>
                                  <p className='font-semibold text-sm text-neutral-900 truncate'>
                                    Dr. {doctor.userId?.firstName} {doctor.userId?.lastName}
                                  </p>
                                  <p className='text-xs text-neutral-600 truncate'>
                                    {doctor.professional?.specialization?.join(', ') || 'General Medicine'}
                                  </p>
                                  <p className='text-xs text-neutral-500 mt-1 truncate'>
                                    {doctor.clinicAddress || doctor.professional?.clinicAddress || 'Address not available'}
                                  </p>
                                  <div className='flex items-center gap-2 mt-2 flex-wrap'>
                                    <a
                                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                                        doctor.clinicAddress || doctor.professional?.clinicAddress || ''
                                      )}`}
                                      target='_blank'
                                      rel='noopener noreferrer'
                                      onClick={(e) => e.stopPropagation()}
                                      className='text-xs text-primary-600 hover:underline'
                                    >
                                      Get Directions
                                    </a>
                                    {doctor.rating && (
                                      <>
                                        <span className='text-xs text-neutral-400'>•</span>
                                        <span className='text-xs text-neutral-600'>
                                          {doctor.rating.toFixed(1)} ⭐ ({doctor.totalReviews || 0})
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className='h-full flex items-center justify-center bg-neutral-100'>
                      <p className='text-neutral-500'>No doctors found to display on map.</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Doctor Cards - List View */}
            {viewMode === 'list' && (
              <div className='space-y-4'>
              {doctors.length > 0 ? (
                doctors.map((doctor) => (
                  <Card key={doctor._id} className='p-6 hover:shadow-lg transition-shadow'>
                    <div className='flex gap-6'>
                      {/* Doctor Photo */}
                      <div className='flex-shrink-0'>
                        <div className='w-24 h-24 bg-primary-100 rounded-lg flex items-center justify-center'>
                          {doctor.userId?.profilePhoto ? (
                            <img
                              src={doctor.userId.profilePhoto}
                              alt={doctor.userId.firstName}
                              className='w-full h-full object-cover rounded-lg'
                            />
                          ) : (
                            <span className='text-3xl font-bold text-primary-600'>
                              {doctor.userId?.firstName?.charAt(0) || 'D'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Doctor Info */}
                      <div className='flex-1'>
                        <div className='flex items-start justify-between mb-2'>
                          <div>
                            <h3 className='text-xl font-bold text-neutral-900'>
                              Dr. {doctor.userId?.firstName} {doctor.userId?.lastName}
                            </h3>
                            <p className='text-neutral-600'>
                              {doctor.professional?.specialization?.join(', ') || 'General Medicine'}
                            </p>
                            <p className='text-sm text-neutral-500'>
                              {doctor.professional?.qualification || 'MBBS'}
                              {doctor.professional?.experienceYears &&
                                ` • ${doctor.professional.experienceYears} years experience`}
                            </p>
                          </div>
                          <div className='text-right'>
                            <StarRating rating={doctor.rating || 4.5} />
                            <p className='text-sm text-neutral-500 mt-1'>
                              {doctor.totalReviews || 0} reviews
                            </p>
                          </div>
                        </div>

                        <div className='flex items-center gap-4 mb-4 text-sm text-neutral-600'>
                          <span>📍 Clinic Address</span>
                          <span>💰 ₹{doctor.consultationFee || 500}/consultation</span>
                          {doctor.schedule?.workingDays?.length > 0 && (
                            <span>✅ Available Today</span>
                          )}
                        </div>

                        <div className='flex items-center gap-2'>
                          <Link href={`/patient-portal/doctors/${doctor._id}`}>
                            <Button variant='primary' size='sm'>
                              View Profile
                            </Button>
                          </Link>
                          <Link href={`/patient-portal/appointments/book?doctorId=${doctor._id}`}>
                            <Button variant='secondary' size='sm'>
                              Book Appointment
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <Card className='p-12 text-center'>
                  <p className='text-neutral-500'>No doctors found. Try adjusting your filters.</p>
                </Card>
              )}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className='mt-8 flex items-center justify-center gap-2'>
                <Button
                  variant='secondary'
                  size='sm'
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                <div className='flex gap-1'>
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'primary' : 'secondary'}
                        size='sm'
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant='secondary'
                  size='sm'
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
