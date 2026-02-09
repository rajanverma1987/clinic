/**
 * Trash (delete) – Lucide React. Use for delete, remove actions.
 */
import { Trash2 } from 'lucide-react';

export function TrashIcon({
  className = 'icon icon-sm',
  color = 'currentColor',
  ariaHidden = true,
  ...props
}) {
  return (
    <Trash2
      className={className}
      color={color}
      strokeWidth={2}
      aria-hidden={ariaHidden}
      {...props}
    />
  );
}
