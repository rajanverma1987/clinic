/**
 * Key icon – Lucide React. Use for password reset, credentials, access.
 */
import { KeyRound } from 'lucide-react';

export function KeyIcon({
  className = 'icon icon-sm',
  color = 'currentColor',
  ariaHidden = true,
  ...props
}) {
  return (
    <KeyRound
      className={className}
      color={color}
      strokeWidth={2}
      aria-hidden={ariaHidden}
      {...props}
    />
  );
}
