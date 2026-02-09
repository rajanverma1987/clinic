/**
 * Filter – Lucide React. Use for filter dropdowns, filter controls.
 */
import { Filter } from 'lucide-react';

export function FilterIcon({
  className = 'icon icon-sm',
  color = 'currentColor',
  ariaHidden = true,
  ...props
}) {
  return (
    <Filter
      className={className}
      color={color}
      strokeWidth={2}
      aria-hidden={ariaHidden}
      {...props}
    />
  );
}
