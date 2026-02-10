/**
 * Minus (decrease) – Lucide React. Use for decrease, reduce, subtract actions.
 */
import { Minus } from 'lucide-react';

export function MinusIcon({
  className = 'icon icon-sm',
  color = 'currentColor',
  ariaHidden = true,
  ...props
}) {
  return (
    <Minus
      className={className}
      color={color}
      strokeWidth={2}
      aria-hidden={ariaHidden}
      {...props}
    />
  );
}
