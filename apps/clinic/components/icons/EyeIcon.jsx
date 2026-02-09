/**
 * Eye (visible) – Lucide React. Use for show/preview, visibility on.
 */
import { Eye } from 'lucide-react';

export function EyeIcon({
  className = 'icon icon-sm',
  color = 'currentColor',
  ariaHidden = true,
  ...props
}) {
  return (
    <Eye className={className} color={color} strokeWidth={2} aria-hidden={ariaHidden} {...props} />
  );
}
