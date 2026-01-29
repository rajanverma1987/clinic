/**
 * Chevron down icon – Lucide React. Use for dropdowns, expand, accordions.
 */
import { ChevronDown } from 'lucide-react';

export function ChevronDownIcon({
  className = 'icon icon-sm',
  color = 'currentColor',
  ariaHidden = true,
  ...props
}) {
  return (
    <ChevronDown
      className={className}
      color={color}
      strokeWidth={2}
      aria-hidden={ariaHidden}
      {...props}
    />
  );
}
