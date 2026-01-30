/**
 * User add icon – Lucide React. Use for add patient, new user, registration.
 */
import { UserPlus } from 'lucide-react';

export function UserAddIcon({
  className = 'icon icon-sm',
  color = 'currentColor',
  ariaHidden = true,
  ...props
}) {
  return (
    <UserPlus
      className={className}
      color={color}
      strokeWidth={2}
      aria-hidden={ariaHidden}
      {...props}
    />
  );
}
