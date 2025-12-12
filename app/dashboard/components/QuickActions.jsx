'use client';

import { CalendarIcon, PrescriptionIcon, QueueIcon, UserAddIcon } from '@/components/icons';
import { Card } from '@/components/ui/Card';

function QuickActionButton({ icon: Icon, label, onClick }) {
  return (
    <button className='quick-action-btn' onClick={onClick}>
      <div className='quick-action-icon'>
        <Icon className='w-5 h-5 text-primary-500' />
      </div>
      <span className='text-sm font-semibold text-neutral-700 group-hover:text-primary-600'>
        {label}
      </span>
    </button>
  );
}

export function QuickActions({ onNavigate, loading = false }) {
  if (loading) {
    return (
      <Card
        elevated={true}
        className='border-2 border-neutral-100 bg-gradient-to-br from-white to-neutral-50'
      >
        <div style={{ padding: '24px 24px 24px 10px' }}>
          <div className='flex items-center mb-4' style={{ gap: 'var(--gap-2)' }}>
            <div className='skeleton w-2 h-2 rounded-full' />
            <div className='skeleton skeleton-text w-32' />
          </div>
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className='quick-action-btn' style={{ pointerEvents: 'none' }}>
                <div className='skeleton w-12 h-12 rounded-xl mb-2' />
                <div className='skeleton skeleton-text w-20' />
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      elevated={true}
      className='border-2 border-neutral-100 bg-gradient-to-br from-white to-neutral-50'
    >
      <div style={{ padding: '24px 24px 24px 10px' }}>
        <div className='flex items-center mb-4' style={{ gap: 'var(--gap-2)' }}>
          <div className='w-2 h-2 bg-primary-500 rounded-full'></div>
          <h2 className='text-neutral-900 text-h4'>Quick Actions</h2>
        </div>
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
          <QuickActionButton
            icon={CalendarIcon}
            label='New Appointment'
            onClick={() => onNavigate('/appointments/new')}
          />
          <QuickActionButton
            icon={UserAddIcon}
            label='New Patient'
            onClick={() => onNavigate('/patients?new=true')}
          />
          <QuickActionButton
            icon={PrescriptionIcon}
            label='New Prescription'
            onClick={() => onNavigate('/prescriptions/new')}
          />
          <QuickActionButton
            icon={QueueIcon}
            label='View Queue'
            onClick={() => onNavigate('/queue')}
          />
        </div>
      </div>
    </Card>
  );
}
