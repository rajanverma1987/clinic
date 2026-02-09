/**
 * More vertical (three dots) – Lucide React. Use for row actions, overflow menu.
 */
import { MoreVertical } from 'lucide-react';

export function MoreVerticalIcon({
  className = 'icon icon-sm',
  color = 'currentColor',
  ariaHidden = true,
  ...props
}) {
  return (
    <MoreVertical
      className={className}
      color={color}
      strokeWidth={2}
      aria-hidden={ariaHidden}
      {...props}
    />
  );
}
