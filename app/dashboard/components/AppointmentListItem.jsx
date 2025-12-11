'use client';

import { CalendarIcon, ClockIcon, ChevronRightIcon } from '@/components/icons';

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

  const doctor =
    appointment.doctorId?.name ||
    `Dr. ${appointment.doctorId?.firstName || ''} ${appointment.doctorId?.lastName || ''}`.trim() ||
    'Not assigned';

  const reason = appointment.reason || appointment.type || 'General Consultation';

  return (
    <div className="dashboard-list-item dashboard-list-item-primary group" onClick={onClick}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          {/* Icon */}
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(45, 156, 219, 0.1)' }}
          >
            <CalendarIcon className="w-5 h-5 text-primary-500" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="text-body-md font-semibold text-neutral-900 mb-1 truncate">
              {patientName}
            </h4>
            <p className="text-body-sm text-neutral-600 mb-2 truncate">{reason}</p>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1 text-body-xs text-neutral-500">
                <ClockIcon className="w-4 h-4" />
                <span>{timeStr}</span>
              </div>
              <div className="text-body-xs text-neutral-500 truncate">{doctor}</div>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <ChevronRightIcon className="w-5 h-5 text-neutral-400 group-hover:text-primary-500 transition-colors flex-shrink-0 ml-2" />
      </div>
    </div>
  );
}
