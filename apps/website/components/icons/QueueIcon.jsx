/**
 * Queue / clipboard icon – Lucide React. Use for queue, check-in, list.
 */
import { ClipboardList } from 'lucide-react';

export function QueueIcon({
  className = 'icon icon-sm',
  color = 'currentColor',
  ariaHidden = true,
  ...props
}) {
  return (
    <ClipboardList
      className={className}
      color={color}
      strokeWidth={2}
      aria-hidden={ariaHidden}
      {...props}
    />
  );
}
