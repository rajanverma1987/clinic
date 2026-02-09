/**
 * Bell icon – Lucide React. Use for reminders, notifications.
 */
import { Bell } from 'lucide-react';

export function BellIcon({
  className = 'icon icon-sm',
  color = 'currentColor',
  ariaHidden = true,
  ...props
}) {
  return (
    <Bell
      className={className}
      color={color}
      strokeWidth={2}
      aria-hidden={ariaHidden}
      {...props}
    />
  );
}
