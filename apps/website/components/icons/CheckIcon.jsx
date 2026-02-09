/**
 * Check icon – Lucide React. Use for success, confirm, done.
 */
import { Check } from 'lucide-react';

export function CheckIcon({
  className = 'icon icon-sm',
  color = 'currentColor',
  ariaHidden = true,
  ...props
}) {
  return (
    <Check
      className={className}
      color={color}
      strokeWidth={2}
      aria-hidden={ariaHidden}
      {...props}
    />
  );
}
