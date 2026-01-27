'use client';

import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Star rating component
function StarRating({ rating, maxRating = 5 }) {
  return (
    <div className='flex items-center gap-1'>
      {Array.from({ length: maxRating }).map((_, index) => (
        <svg
          key={index}
          className={`icon icon-sm ${
            index < rating ? 'text-yellow-400 fill-current' : 'text-neutral-300'
          }`}
          viewBox='0 0 20 20'
          fill='currentColor'
        >
          <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
        </svg>
      ))}
      <span className='ml-2 text-sm font-medium text-neutral-700'>{rating.toFixed(1)}</span>
    </div>
  );
}

export default function DoctorReviewsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [doctorId, setDoctorId] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingDistribution, setRatingDistribution] = useState({});
  const [filterRating, setFilterRating] = useState('all'); // all, 5, 4, 3, 2, 1
  const [searchQuery, setSearchQuery] = useState('');
  const [respondingTo, setRespondingTo] = useState(null);
  const [responseText, setResponseText] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'doctor') {
      router.push('/dashboard');
      return;
    }
    fetchDoctorId();
  }, [authLoading, user, router]);

  useEffect(() => {
    if (doctorId) {
      fetchReviews();
    }
  }, [doctorId]);

  useEffect(() => {
    filterReviews();
  }, [reviews, filterRating, searchQuery]);

  const fetchDoctorId = async () => {
    try {
      const doctorResponse = await apiClient.get(`/doctors/user/${user._id}`);
      if (doctorResponse.success && doctorResponse.data) {
        setDoctorId(doctorResponse.data._id);
      } else {
        throw new Error('Doctor profile not found');
      }
    } catch (err) {
      console.error('Failed to fetch doctor profile:', err);
    }
  };

  const fetchReviews = async () => {
    if (!doctorId) return;

    try {
      setLoading(true);
      // Fetch reviews from Review model
      const reviewsResponse = await apiClient.get(`/doctors/${doctorId}/reviews`);

      if (reviewsResponse.success && reviewsResponse.data) {
        const reviewsData = reviewsResponse.data.reviews || [];
        setReviews(reviewsData);
        
        // Set stats from API response
        setAverageRating(reviewsResponse.data.averageRating || 0);
        
        // Calculate distribution
        const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        reviewsData.forEach((review) => {
          const rating = Math.round(review.rating || 0);
          if (rating >= 1 && rating <= 5) {
            distribution[rating]++;
          }
        });
        setRatingDistribution(distribution);
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };


  const filterReviews = () => {
    let filtered = [...reviews];

    // Filter by rating
    if (filterRating !== 'all') {
      const ratingNum = parseInt(filterRating);
      filtered = filtered.filter((review) => Math.round(review.rating) === ratingNum);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (review) =>
          review.patientName.toLowerCase().includes(query) ||
          review.reviewText.toLowerCase().includes(query)
      );
    }

    setFilteredReviews(filtered);
  };

  const handleRespondToReview = async (reviewId) => {
    if (!responseText.trim()) {
      alert('Please enter a response');
      return;
    }

    try {
      // In a real system, you'd have an API endpoint to add doctor response
      // For now, we'll update locally
      const response = await apiClient.put(`/appointments/${reviewId}/review-response`, {
        doctorResponse: responseText,
      });

      if (response.success) {
        setReviews((prev) =>
          prev.map((r) => (r._id === reviewId ? { ...r, doctorResponse: responseText } : r))
        );
        setRespondingTo(null);
        setResponseText('');
        alert('Response saved successfully');
      } else {
        alert('Failed to save response');
      }
    } catch (err) {
      console.error('Failed to respond to review:', err);
      alert('Failed to save response');
    }
  };

  const handleFlagReview = async (reviewId) => {
    if (!confirm('Are you sure you want to flag this review as inappropriate?')) {
      return;
    }

    try {
      // In a real system, you'd have an API endpoint to flag reviews
      alert('Review flagged. It will be reviewed by administrators.');
    } catch (err) {
      console.error('Failed to flag review:', err);
      alert('Failed to flag review');
    }
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

  const totalReviews = reviews.length;

  return (
    <Layout>
      <div className='max-w-7xl mx-auto space-y-6'>
        <PageHeader
          title='Reviews & Ratings'
          subtitle='View and respond to patient reviews'
        />

        {/* Summary Cards */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <Card>
            <div className='p-6'>
              <div className='flex items-center justify-between mb-2'>
                <h3 className='text-sm font-medium text-neutral-600'>Average Rating</h3>
              </div>
              <div className='flex items-center gap-3'>
                <StarRating rating={averageRating} />
                <span className='text-2xl font-bold text-neutral-900'>
                  {averageRating.toFixed(1)}
                </span>
              </div>
              <p className='text-sm text-neutral-500 mt-2'>{totalReviews} total reviews</p>
            </div>
          </Card>

          <Card>
            <div className='p-6'>
              <h3 className='text-sm font-medium text-neutral-600 mb-4'>Rating Distribution</h3>
              <div className='space-y-2'>
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = ratingDistribution[rating] || 0;
                  const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                  return (
                    <div key={rating} className='flex items-center gap-2'>
                      <span className='text-sm text-neutral-600 w-8'>{rating}★</span>
                      <div className='flex-1 bg-neutral-200 rounded-full h-2'>
                        <div
                          className='bg-yellow-400 h-2 rounded-full'
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className='text-sm text-neutral-600 w-8'>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          <Card>
            <div className='p-6'>
              <h3 className='text-sm font-medium text-neutral-600 mb-2'>Total Reviews</h3>
              <p className='text-3xl font-bold text-neutral-900'>{totalReviews}</p>
              <p className='text-sm text-neutral-500 mt-2'>All time</p>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <div className='p-4'>
            <div className='flex flex-col md:flex-row gap-4'>
              <div className='flex-1'>
                <Input
                  type='text'
                  placeholder='Search reviews by patient name or review text...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className='flex gap-2'>
                <Button
                  variant={filterRating === 'all' ? 'primary' : 'secondary'}
                  size='sm'
                  onClick={() => setFilterRating('all')}
                >
                  All
                </Button>
                <Button
                  variant={filterRating === '5' ? 'primary' : 'secondary'}
                  size='sm'
                  onClick={() => setFilterRating('5')}
                >
                  5★
                </Button>
                <Button
                  variant={filterRating === '4' ? 'primary' : 'secondary'}
                  size='sm'
                  onClick={() => setFilterRating('4')}
                >
                  4★
                </Button>
                <Button
                  variant={filterRating === '3' ? 'primary' : 'secondary'}
                  size='sm'
                  onClick={() => setFilterRating('3')}
                >
                  3★
                </Button>
                <Button
                  variant={filterRating === '2' ? 'primary' : 'secondary'}
                  size='sm'
                  onClick={() => setFilterRating('2')}
                >
                  2★
                </Button>
                <Button
                  variant={filterRating === '1' ? 'primary' : 'secondary'}
                  size='sm'
                  onClick={() => setFilterRating('1')}
                >
                  1★
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Reviews List */}
        <div className='space-y-4'>
          {filteredReviews.length > 0 ? (
            filteredReviews.map((review) => (
              <Card key={review._id}>
                <div className='p-6'>
                  <div className='flex items-start justify-between mb-4'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-3 mb-2'>
                        <div className='w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center'>
                          <span className='text-primary-600 font-semibold'>
                            {review.patientName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h4 className='font-semibold text-neutral-900'>{review.patientName}</h4>
                          <p className='text-sm text-neutral-500'>
                            {new Date(review.appointmentDate || review.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <StarRating rating={review.rating} />
                    </div>
                    <div className='flex gap-2'>
                      {!review.doctorResponse && (
                        <Button
                          variant='secondary'
                          size='sm'
                          onClick={() => setRespondingTo(review._id)}
                        >
                          Respond
                        </Button>
                      )}
                      <Button
                        variant='secondary'
                        size='sm'
                        onClick={() => handleFlagReview(review._id)}
                      >
                        Flag
                      </Button>
                    </div>
                  </div>

                  <p className='text-neutral-700 mb-4'>{review.reviewText}</p>

                  {review.doctorResponse && (
                    <div className='mt-4 p-4 bg-primary-50 rounded-lg border border-primary-200'>
                      <div className='flex items-center gap-2 mb-2'>
                        <span className='font-semibold text-primary-900'>Your Response:</span>
                        <span className='text-sm text-primary-600'>
                          {new Date(review.updatedAt || review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className='text-primary-800'>{review.doctorResponse}</p>
                    </div>
                  )}

                  {respondingTo === review._id && (
                    <div className='mt-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200'>
                      <textarea
                        className='w-full p-3 border border-neutral-300 rounded-lg mb-3'
                        rows={3}
                        placeholder='Write your response...'
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                      />
                      <div className='flex gap-2'>
                        <Button
                          variant='primary'
                          size='sm'
                          onClick={() => handleRespondToReview(review._id)}
                        >
                          Submit Response
                        </Button>
                        <Button
                          variant='secondary'
                          size='sm'
                          onClick={() => {
                            setRespondingTo(null);
                            setResponseText('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))
          ) : (
            <Card>
              <div className='p-12 text-center'>
                <p className='text-neutral-500'>No reviews found</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
