/**
 * Calendar icon – Lucide React. Use for appointments, scheduling, dates.
 */
import { Calendar } from 'lucide-react';

export function CalendarIcon({
  className = 'icon icon-sm',
  color = 'currentColor',
  ariaHidden = true,
  ...props
}) {
  return (
    <Calendar
      className={className}
      color={color}
      strokeWidth={2}
      aria-hidden={ariaHidden}
      {...props}
    />
  );
}
