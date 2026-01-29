/**
 * Clock icon – Lucide React. Use for time, schedule, duration.
 */
import { Clock } from 'lucide-react';

export function ClockIcon({
  className = 'icon icon-sm',
  color = 'currentColor',
  ariaHidden = true,
  ...props
}) {
  return (
    <Clock
      className={className}
      color={color}
      strokeWidth={2}
      aria-hidden={ariaHidden}
      {...props}
    />
  );
}
