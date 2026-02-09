/**
 * Home icon – Lucide React. Use for location, building, multi-location.
 */
import { Home } from 'lucide-react';

export function HomeIcon({
  className = 'icon icon-sm',
  color = 'currentColor',
  ariaHidden = true,
  ...props
}) {
  return (
    <Home
      className={className}
      color={color}
      strokeWidth={2}
      aria-hidden={ariaHidden}
      {...props}
    />
  );
}
