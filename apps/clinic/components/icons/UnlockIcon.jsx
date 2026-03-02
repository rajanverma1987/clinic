/**
 * Unlock icon – Lucide React. Use for unlock account, re-enable access.
 */
import { Unlock } from 'lucide-react';

export function UnlockIcon({
  className = 'icon icon-sm',
  color = 'currentColor',
  ariaHidden = true,
  ...props
}) {
  return (
    <Unlock
      className={className}
      color={color}
      strokeWidth={2}
      aria-hidden={ariaHidden}
      {...props}
    />
  );
}
