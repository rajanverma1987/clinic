'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { Tag } from '@/components/ui/Tag';
import { apiClient } from '@/lib/api/client';
import { extractArrayData } from '@/lib/utils/api-response-extractor';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function PatientFamilyMembersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    relationship: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    email: '',
    bloodGroup: '',
    allergies: '',
    chronicConditions: '',
    emergencyContact: '',
  });

  useEffect(() => {
    fetchFamilyMembers();
  }, []);

  const fetchFamilyMembers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/patients/family-members');
      if (response.success) {
        const members = extractArrayData(response);
        setFamilyMembers(Array.isArray(members) ? members : []);
      }
    } catch (err) {
      console.error('Failed to fetch family members:', err);
      setFamilyMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMember) {
        const response = await apiClient.put(`/patients/family-members/${editingMember._id}`, formData);
        if (response.success) {
          alert('Family member updated successfully');
          setShowAddForm(false);
          setEditingMember(null);
          resetForm();
          fetchFamilyMembers();
        } else {
          alert('Failed to update family member');
        }
      } else {
        const response = await apiClient.post('/patients/family-members', formData);
        if (response.success) {
          alert('Family member added successfully');
          setShowAddForm(false);
          resetForm();
          fetchFamilyMembers();
        } else {
          alert('Failed to add family member');
        }
      }
    } catch (err) {
      alert('Failed to save family member');
    }
  };

  const handleDelete = async (memberId) => {
    if (!confirm('Are you sure you want to delete this family member?')) {
      return;
    }
    try {
      const response = await apiClient.delete(`/patients/family-members/${memberId}`);
      if (response.success) {
        alert('Family member deleted successfully');
        fetchFamilyMembers();
      } else {
        alert('Failed to delete family member');
      }
    } catch (err) {
      alert('Failed to delete family member');
    }
  };

  const handleEdit = (member) => {
    setEditingMember(member);
    setFormData({
      firstName: member.firstName || '',
      lastName: member.lastName || '',
      relationship: member.relationship || '',
      dateOfBirth: member.dateOfBirth ? new Date(member.dateOfBirth).toISOString().split('T')[0] : '',
      gender: member.gender || '',
      phone: member.phone || '',
      email: member.email || '',
      bloodGroup: member.bloodGroup || '',
      allergies: member.allergies?.join(', ') || '',
      chronicConditions: member.chronicConditions?.join(', ') || '',
      emergencyContact: member.emergencyContact || '',
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      relationship: '',
      dateOfBirth: '',
      gender: '',
      phone: '',
      email: '',
      bloodGroup: '',
      allergies: '',
      chronicConditions: '',
      emergencyContact: '',
    });
    setEditingMember(null);
  };

  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
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
          </div>
        </div>
      </header>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='flex items-center justify-between mb-6'>
          <h1 className='text-3xl font-bold text-neutral-900'>Family Members</h1>
          <Button
            variant='primary'
            onClick={() => {
              resetForm();
              setShowAddForm(true);
            }}
          >
            <svg className='icon icon-sm mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 6v6m0 0v6m0-6h6m-6 0H6'
              />
            </svg>
            Add Family Member
          </Button>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <Card className='p-6 mb-6'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-xl font-bold text-neutral-900'>
                {editingMember ? 'Edit Family Member' : 'Add New Family Member'}
              </h2>
              <Button variant='ghost' size='sm' onClick={() => {
                setShowAddForm(false);
                resetForm();
              }}>
                ✕
              </Button>
            </div>
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    First Name *
                  </label>
                  <Input
                    type='text'
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    Relationship *
                  </label>
                  <select
                    className='w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                    value={formData.relationship}
                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                    required
                  >
                    <option value=''>Select</option>
                    <option value='spouse'>Spouse</option>
                    <option value='child'>Child</option>
                    <option value='parent'>Parent</option>
                    <option value='sibling'>Sibling</option>
                    <option value='other'>Other</option>
                  </select>
                </div>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    Date of Birth *
                  </label>
                  <Input
                    type='date'
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    max={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>Gender *</label>
                  <select
                    className='w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    required
                  >
                    <option value=''>Select</option>
                    <option value='male'>Male</option>
                    <option value='female'>Female</option>
                    <option value='other'>Other</option>
                  </select>
                </div>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>Phone</label>
                  <Input
                    type='tel'
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>Email</label>
                  <Input
                    type='email'
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>Blood Group</label>
                  <select
                    className='w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  >
                    <option value=''>Select</option>
                    <option value='A+'>A+</option>
                    <option value='A-'>A-</option>
                    <option value='B+'>B+</option>
                    <option value='B-'>B-</option>
                    <option value='AB+'>AB+</option>
                    <option value='AB-'>AB-</option>
                    <option value='O+'>O+</option>
                    <option value='O-'>O-</option>
                  </select>
                </div>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    Allergies (comma-separated)
                  </label>
                  <Input
                    type='text'
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    placeholder='e.g., Peanuts, Penicillin'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    Chronic Conditions (comma-separated)
                  </label>
                  <Input
                    type='text'
                    value={formData.chronicConditions}
                    onChange={(e) => setFormData({ ...formData, chronicConditions: e.target.value })}
                    placeholder='e.g., Diabetes, Hypertension'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    Emergency Contact
                  </label>
                  <Input
                    type='tel'
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    placeholder='Emergency contact number'
                  />
                </div>
              </div>
              <div className='flex items-center gap-3 pt-4'>
                <Button type='submit' variant='primary'>
                  {editingMember ? 'Update' : 'Add'} Family Member
                </Button>
                <Button type='button' variant='secondary' onClick={() => {
                  setShowAddForm(false);
                  resetForm();
                }}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Family Members List */}
        {familyMembers.length > 0 ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {familyMembers.map((member) => (
              <Card key={member._id} className='p-6 hover:shadow-lg transition-shadow'>
                <div className='flex items-start justify-between mb-4'>
                  <div className='flex items-center gap-3'>
                    <div className='w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center'>
                      <span className='text-2xl font-bold text-primary-600'>
                        {member.firstName?.charAt(0) || 'F'}
                      </span>
                    </div>
                    <div>
                      <h3 className='text-lg font-bold text-neutral-900'>
                        {member.firstName} {member.lastName}
                      </h3>
                      <Tag className='bg-primary-100 text-primary-800 text-xs mt-1'>
                        {member.relationship || 'Family Member'}
                      </Tag>
                    </div>
                  </div>
                  <div className='flex items-center gap-1'>
                    <Button
                      variant='ghost'
                      size='xs'
                      onClick={() => handleEdit(member)}
                    >
                      <svg className='icon icon-xs' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                        />
                      </svg>
                    </Button>
                    <Button
                      variant='ghost'
                      size='xs'
                      onClick={() => handleDelete(member._id)}
                    >
                      <svg className='icon icon-xs text-red-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                        />
                      </svg>
                    </Button>
                  </div>
                </div>
                <div className='space-y-2 text-sm'>
                  <div className='flex items-center justify-between'>
                    <span className='text-neutral-600'>Age:</span>
                    <span className='font-semibold text-neutral-900'>
                      {calculateAge(member.dateOfBirth)} years
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-neutral-600'>Gender:</span>
                    <span className='font-semibold text-neutral-900 capitalize'>{member.gender}</span>
                  </div>
                  {member.bloodGroup && (
                    <div className='flex items-center justify-between'>
                      <span className='text-neutral-600'>Blood Group:</span>
                      <span className='font-semibold text-neutral-900'>{member.bloodGroup}</span>
                    </div>
                  )}
                  {member.phone && (
                    <div className='flex items-center justify-between'>
                      <span className='text-neutral-600'>Phone:</span>
                      <span className='font-semibold text-neutral-900'>{member.phone}</span>
                    </div>
                  )}
                  {member.allergies && member.allergies.length > 0 && (
                    <div className='mt-3 pt-3 border-t border-neutral-200'>
                      <p className='text-xs text-neutral-600 mb-1'>Allergies:</p>
                      <div className='flex flex-wrap gap-1'>
                        {Array.isArray(member.allergies) ? (
                          member.allergies.map((allergy, index) => (
                            <Tag key={index} className='bg-red-100 text-red-800 text-xs'>
                              {allergy}
                            </Tag>
                          ))
                        ) : (
                          <Tag className='bg-red-100 text-red-800 text-xs'>{member.allergies}</Tag>
                        )}
                      </div>
                    </div>
                  )}
                  {member.chronicConditions && member.chronicConditions.length > 0 && (
                    <div className='mt-2'>
                      <p className='text-xs text-neutral-600 mb-1'>Chronic Conditions:</p>
                      <div className='flex flex-wrap gap-1'>
                        {Array.isArray(member.chronicConditions) ? (
                          member.chronicConditions.map((condition, index) => (
                            <Tag key={index} className='bg-yellow-100 text-yellow-800 text-xs'>
                              {condition}
                            </Tag>
                          ))
                        ) : (
                          <Tag className='bg-yellow-100 text-yellow-800 text-xs'>{member.chronicConditions}</Tag>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className='mt-4 pt-4 border-t border-neutral-200 flex items-center gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    className='flex-1'
                    onClick={() => router.push(`/patient-portal/appointments/book?familyMemberId=${member._id}`)}
                  >
                    <svg className='icon icon-xs mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                      />
                    </svg>
                    Book Appointment
                  </Button>
                  <Button
                    variant='secondary'
                    size='sm'
                    className='flex-1'
                    onClick={() => router.push(`/patient-portal/medical-records?patientId=${member._id}`)}
                  >
                    <svg className='icon icon-xs mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                      />
                    </svg>
                    View Records
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className='p-12 text-center'>
            <div className='w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <svg className='w-10 h-10 text-neutral-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
                />
              </svg>
            </div>
            <p className='text-neutral-500 mb-4'>No family members added yet</p>
            <Button variant='primary' onClick={() => setShowAddForm(true)}>
              Add Your First Family Member
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
