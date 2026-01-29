/**
 * X / close icon – Lucide React. Use for close, dismiss, cancel.
 */
import { X } from 'lucide-react';

export function XIcon({
  className = 'icon icon-sm',
  color = 'currentColor',
  ariaHidden = true,
  ...props
}) {
  return (
    <X
      className={className}
      color={color}
      strokeWidth={2}
      aria-hidden={ariaHidden}
      {...props}
    />
  );
}
