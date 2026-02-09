/**
 * Users icon – Lucide React. Use for patients, team, people.
 */
import { Users } from 'lucide-react';

export function UsersIcon({
  className = 'icon icon-sm',
  color = 'currentColor',
  ariaHidden = true,
  ...props
}) {
  return (
    <Users
      className={className}
      color={color}
      strokeWidth={2}
      aria-hidden={ariaHidden}
      {...props}
    />
  );
}
