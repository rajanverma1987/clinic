/**
 * Pencil (edit) – Lucide React. Use for edit, modify actions.
 */
import { Pencil } from 'lucide-react';

export function PencilIcon({
  className = 'icon icon-sm',
  color = 'currentColor',
  ariaHidden = true,
  ...props
}) {
  return (
    <Pencil
      className={className}
      color={color}
      strokeWidth={2}
      aria-hidden={ariaHidden}
      {...props}
    />
  );
}
