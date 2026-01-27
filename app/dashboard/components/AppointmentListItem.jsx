'use client';

import { ClockIcon } from '@/components/icons';

export function AppointmentListItem({ appointment, onClick }) {
  const appointmentTime = new Date(appointment.appointmentDate || appointment.date);
  const timeStr = appointmentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const patientName =
    appointment.patientId?.name ||
    `${appointment.patientId?.firstName || ''} ${appointment.patientId?.lastName || ''}`.trim() ||
    'Unknown Patient';

  const firstName = appointment.patientId?.firstName || '';
  const lastName = appointment.patientId?.lastName || '';
  const initials = `${firstName.charAt(0) || ''}${lastName.charAt(0) || ''}`.toUpperCase() || 'PN';

  const reason = appointment.reason || appointment.type || 'General Consultation';
  
  const status = appointment.status || 'scheduled';
  const isOngoing = status === 'in_progress' || status === 'arrived';

  return (
    <div className="dashboard-appointment-item group" onClick={onClick}>
      <div className="flex items-center gap-3">
        {/* Patient Avatar */}
        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 border-2 border-primary-200">
          <span className="text-primary-600 font-semibold text-sm">
            {initials}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="text-body-sm font-semibold text-neutral-900 mb-0.5 truncate">
            {patientName}
          </h4>
          <p className="text-body-xs text-neutral-600 truncate">{reason}</p>
        </div>

        {/* Time Badge */}
        <div className={`time-badge ${isOngoing ? 'time-badge-ongoing' : ''}`}>
          {isOngoing ? (
            <span className="text-body-xs font-semibold">On Going</span>
          ) : (
            <div className="flex items-center gap-1">
              <ClockIcon className="icon icon-xs" />
              <span className="text-body-xs font-semibold">{timeStr}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
