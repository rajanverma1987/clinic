/**
 * Eye off (hidden) – Lucide React. Use for hide, visibility off.
 */
import { EyeOff } from 'lucide-react';

export function EyeOffIcon({
  className = 'icon icon-sm',
  color = 'currentColor',
  ariaHidden = true,
  ...props
}) {
  return (
    <EyeOff
      className={className}
      color={color}
      strokeWidth={2}
      aria-hidden={ariaHidden}
      {...props}
    />
  );
}
