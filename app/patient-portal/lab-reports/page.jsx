'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { Tag } from '@/components/ui/Tag';
import { apiClient } from '@/lib/api/client';
import { extractArrayData } from '@/lib/utils/api-response-extractor';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function PatientLabReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [labReports, setLabReports] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [testTrends, setTestTrends] = useState({});

  useEffect(() => {
    fetchLabReports();
  }, []);

  const fetchLabReports = async () => {
    try {
      setLoading(true);
      // Fetch lab reports from prescriptions
      const prescriptionsResponse = await apiClient.get('/prescriptions?limit=100');
      if (prescriptionsResponse.success) {
        const prescriptions = extractArrayData(prescriptionsResponse);
        const labItems = prescriptions
          .flatMap((p) => p.items?.filter((i) => i.itemType === 'lab' || i.type === 'lab') || [])
          .map((item, index) => ({
            _id: `lab-${index}`,
            testName: item.labTestName || item.itemName || 'Lab Test',
            date: p.createdAt || new Date(),
            status: 'completed',
            prescriptionId: p._id,
            doctorId: p.doctorId,
            results: item.results || [],
            normalRange: item.normalRange || 'N/A',
          }));
        setLabReports(labItems);

        // Calculate trends for repeated tests
        const trends = {};
        labItems.forEach((report) => {
          const testName = report.testName;
          if (!trends[testName]) {
            trends[testName] = [];
          }
          trends[testName].push({
            date: report.date,
            value: report.results?.[0]?.value || null,
            normalRange: report.normalRange,
          });
        });
        setTestTrends(trends);
      }

      // Also try to fetch from dedicated lab reports endpoint if available
      try {
        const labResponse = await apiClient.get('/lab-results');
        if (labResponse.success) {
          const labData = extractArrayData(labResponse);
          setLabReports((prev) => [...prev, ...labData]);
        }
      } catch (err) {
        // Endpoint might not exist yet
      }
    } catch (err) {
      console.error('Failed to fetch lab reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PDF, JPG, or PNG file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'lab-report');

      const response = await apiClient.post('/patients/me/documents', formData);
      if (response.success) {
        alert('Lab report uploaded successfully');
        fetchLabReports();
      } else {
        alert('Failed to upload lab report');
      }
    } catch (err) {
      alert('Failed to upload lab report');
    } finally {
      setUploading(false);
    }
  };

  const shareWithDoctor = async (reportId, doctorId) => {
    try {
      const response = await apiClient.post(`/patients/me/documents/${reportId}/share`, {
        doctorId,
      });
      if (response.success) {
        alert('Lab report shared with doctor successfully');
      }
    } catch (err) {
      alert('Failed to share lab report');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
            <Link href='/patient-portal/dashboard' className='flex items-center gap-2'>
              <div className='w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center'>
                <span className='text-white font-bold text-xl'>C</span>
              </div>
              <span className='text-xl font-bold text-neutral-900'>ClinicTool</span>
            </Link>
            <div className='flex items-center gap-3'>
              <label className='cursor-pointer'>
                <input
                  type='file'
                  className='hidden'
                  accept='.pdf,.jpg,.jpeg,.png'
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                <Button variant='secondary' size='sm' disabled={uploading} as='span'>
                  {uploading ? 'Uploading...' : 'Upload Report'}
                </Button>
              </label>
              <Link href='/patient-portal/lab-tests/book'>
                <Button variant='primary' size='sm'>
                  Book Lab Test
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <h1 className='text-3xl font-bold text-neutral-900 mb-6'>Lab Reports</h1>

        {labReports.length > 0 ? (
          <div className='space-y-6'>
            {labReports.map((report) => {
              const hasTrends = testTrends[report.testName] && testTrends[report.testName].length > 1;
              
              return (
                <Card key={report._id} className='p-6'>
                  <div className='flex items-start justify-between mb-4'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-3 mb-2'>
                        <h3 className='text-xl font-bold text-neutral-900'>{report.testName}</h3>
                        <Tag
                          className={
                            report.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : report.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }
                        >
                          {report.status}
                        </Tag>
                      </div>
                      <p className='text-neutral-600 mb-1'>
                        {report.doctorId?.userId?.firstName && (
                          <>Dr. {report.doctorId.userId.firstName} {report.doctorId.userId.lastName} • </>
                        )}
                        {formatDate(report.date)}
                      </p>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setSelectedTest(selectedTest === report._id ? null : report._id)}
                      >
                        {selectedTest === report._id ? 'Hide Details' : 'View Details'}
                      </Button>
                      <Button
                        variant='secondary'
                        size='sm'
                        onClick={() => {
                          const doctorId = prompt('Enter doctor ID to share with');
                          if (doctorId) {
                            shareWithDoctor(report._id, doctorId);
                          }
                        }}
                      >
                        Share
                      </Button>
                    </div>
                  </div>

                  {/* Test Results */}
                  {selectedTest === report._id && (
                    <div className='mt-4 pt-4 border-t border-neutral-200 space-y-4'>
                      {report.results && report.results.length > 0 ? (
                        <div className='space-y-3'>
                          {report.results.map((result, index) => {
                            const isNormal = result.isNormal !== false; // Assume normal if not specified
                            return (
                              <div
                                key={index}
                                className={`p-4 rounded-lg border-2 ${
                                  isNormal
                                    ? 'bg-green-50 border-green-200'
                                    : 'bg-red-50 border-red-200'
                                }`}
                              >
                                <div className='flex items-center justify-between mb-2'>
                                  <h4 className='font-semibold text-neutral-900'>{result.parameter || 'Test Parameter'}</h4>
                                  <Tag
                                    className={
                                      isNormal
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                    }
                                  >
                                    {isNormal ? 'Normal' : 'Abnormal'}
                                  </Tag>
                                </div>
                                <div className='grid grid-cols-2 gap-4 text-sm'>
                                  <div>
                                    <p className='text-neutral-600 mb-1'>Your Value</p>
                                    <p className='font-bold text-lg text-neutral-900'>{result.value || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className='text-neutral-600 mb-1'>Normal Range</p>
                                    <p className='font-semibold text-neutral-700'>{result.normalRange || report.normalRange || 'N/A'}</p>
                                  </div>
                                </div>
                                {result.unit && (
                                  <p className='text-xs text-neutral-500 mt-1'>Unit: {result.unit}</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className='p-4 bg-neutral-50 rounded-lg border border-neutral-200'>
                          <p className='text-neutral-600'>No detailed results available</p>
                          <p className='text-sm text-neutral-500 mt-1'>Normal Range: {report.normalRange || 'N/A'}</p>
                        </div>
                      )}

                      {/* Trends Graph for Repeated Tests */}
                      {hasTrends && (
                        <div className='mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200'>
                          <h4 className='font-semibold text-neutral-900 mb-3 flex items-center gap-2'>
                            <svg className='icon icon-sm text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
                              />
                            </svg>
                            Test Trends (Last {testTrends[report.testName].length} tests)
                          </h4>
                          <div className='space-y-2'>
                            {testTrends[report.testName]
                              .slice()
                              .reverse()
                              .map((trend, index) => (
                                <div key={index} className='flex items-center gap-3'>
                                  <span className='text-xs text-neutral-600 w-24'>
                                    {formatDate(trend.date)}
                                  </span>
                                  <div className='flex-1 bg-white rounded h-6 border border-neutral-200 relative overflow-hidden'>
                                    <div
                                      className='h-full bg-blue-500 flex items-center justify-end pr-2'
                                      style={{
                                        width: trend.value
                                          ? `${Math.min(100, (parseFloat(trend.value) / 200) * 100)}%`
                                          : '0%',
                                      }}
                                    >
                                      {trend.value && (
                                        <span className='text-xs font-semibold text-white'>
                                          {trend.value}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <span className='text-xs text-neutral-500 w-32'>
                                    Range: {trend.normalRange || 'N/A'}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className='p-12 text-center'>
            <div className='w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <svg className='w-10 h-10 text-neutral-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                />
              </svg>
            </div>
            <p className='text-neutral-500 mb-4'>No lab reports found</p>
            <div className='flex items-center justify-center gap-3'>
              <label className='cursor-pointer'>
                <input
                  type='file'
                  className='hidden'
                  accept='.pdf,.jpg,.jpeg,.png'
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                <Button variant='secondary' disabled={uploading} as='span'>
                  Upload Report
                </Button>
              </label>
              <Link href='/patient-portal/lab-tests/book'>
                <Button variant='primary'>Book Lab Test</Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
