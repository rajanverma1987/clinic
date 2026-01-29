/**
 * Chevron right icon – Lucide React. Use for navigation, next, expand.
 */
import { ChevronRight } from 'lucide-react';

export function ChevronRightIcon({
  className = 'icon icon-sm',
  color = 'currentColor',
  ariaHidden = true,
  ...props
}) {
  return (
    <ChevronRight
      className={className}
      color={color}
      strokeWidth={2}
      aria-hidden={ariaHidden}
      {...props}
    />
  );
}
