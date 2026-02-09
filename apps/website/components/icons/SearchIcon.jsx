/**
 * Search icon – Lucide React. Use for search, find, filter.
 */
import { Search } from 'lucide-react';

export function SearchIcon({
  className = 'icon icon-sm',
  color = 'currentColor',
  ariaHidden = true,
  ...props
}) {
  return (
    <Search
      className={className}
      color={color}
      strokeWidth={2}
      aria-hidden={ariaHidden}
      {...props}
    />
  );
}
