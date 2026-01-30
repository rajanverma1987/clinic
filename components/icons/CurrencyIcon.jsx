/**
 * Currency icon – Lucide React. Use for billing, payments, price.
 */
import { CircleDollarSign } from 'lucide-react';

export function CurrencyIcon({
  className = 'icon icon-sm',
  color = 'currentColor',
  ariaHidden = true,
  ...props
}) {
  return (
    <CircleDollarSign
      className={className}
      color={color}
      strokeWidth={2}
      aria-hidden={ariaHidden}
      {...props}
    />
  );
}
