import { Star } from 'lucide-react';

/** Star icon – stroke only (no fill). Use stroke color to indicate state. */
export function StarIcon({
  className = 'icon icon-sm',
  color = 'currentColor',
  ariaHidden = true,
  ...props
}) {
  return (
    <Star
      className={className}
      color={color}
      strokeWidth={2}
      fill='none'
      aria-hidden={ariaHidden}
      {...props}
    />
  );
}
