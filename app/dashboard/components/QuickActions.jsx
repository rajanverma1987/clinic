'use client';

import { Card } from '@/components/ui/Card';
import {
  CalendarIcon,
  UserAddIcon,
  PrescriptionIcon,
  QueueIcon,
} from '@/components/icons';

function QuickActionButton({ icon: Icon, label, onClick }) {
  return (
    <button className="quick-action-btn" onClick={onClick}>
      <div className="quick-action-icon">
        <Icon className="w-5 h-5 text-primary-500" />
      </div>
      <span className="text-sm font-semibold text-neutral-700 group-hover:text-primary-600">
        {label}
      </span>
    </button>
  );
}

export function QuickActions({ onNavigate }) {
  return (
    <Card
      elevated={true}
      className="border-2 border-neutral-100 bg-gradient-to-br from-white to-neutral-50"
    >
      <div className="p-6">
        <div className="flex items-center mb-4" style={{ gap: 'var(--gap-2)' }}>
          <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
          <h2 className="text-neutral-900 text-h4">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickActionButton
            icon={CalendarIcon}
            label="New Appointment"
            onClick={() => onNavigate('/appointments/new')}
          />
          <QuickActionButton
            icon={UserAddIcon}
            label="New Patient"
            onClick={() => onNavigate('/patients?new=true')}
          />
          <QuickActionButton
            icon={PrescriptionIcon}
            label="New Prescription"
            onClick={() => onNavigate('/prescriptions/new')}
          />
          <QuickActionButton
            icon={QueueIcon}
            label="View Queue"
            onClick={() => onNavigate('/queue')}
          />
        </div>
      </div>
    </Card>
  );
}
