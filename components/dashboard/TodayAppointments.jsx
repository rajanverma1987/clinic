'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

/**
 * Virtualized list for today's appointments. Renders only visible rows + overscan
 * to keep long lists performant. Use when appointment count is large (e.g. > 15).
 *
 * @param {object} props
 * @param {object[]} props.appointments - List of appointment objects
 * @param {(appointment: object) => React.ReactNode} props.renderItem - Render function for each row (e.g. AppointmentListItem)
 * @param {number} [props.listHeight=500] - Height of the scroll container (px)
 * @param {number} [props.estimateSize=80] - Estimated row height for virtualization
 * @param {number} [props.overscan=5] - Extra rows to render above/below viewport
 * @param {string} [props.className] - Optional class for the scroll container
 */
export default function TodayAppointments({
  appointments = [],
  renderItem,
  listHeight = 500,
  estimateSize = 80,
  overscan = 5,
  className = '',
}) {
  const parentRef = useRef(null);

  const virtualizer = useVirtualizer({
    count: appointments.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  if (!appointments.length || typeof renderItem !== 'function') {
    return null;
  }

  return (
    <div
      ref={parentRef}
      className={className || 'overflow-auto'}
      style={{ height: listHeight }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const appointment = appointments[virtualRow.index];
          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {renderItem(appointment, virtualRow.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
