/**
 * Phone icon – Lucide React. Use for phone, call, contact.
 */
import { Phone } from 'lucide-react';

export function PhoneIcon({
  className = 'icon icon-sm',
  color = 'currentColor',
  ariaHidden = true,
  ...props
}) {
  return (
    <Phone
      className={className}
      color={color}
      strokeWidth={2}
      aria-hidden={ariaHidden}
      {...props}
    />
  );
}
