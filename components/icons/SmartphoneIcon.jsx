/**
 * Smartphone icon – Lucide React. Use for mobile, device.
 */
import { Smartphone } from 'lucide-react';

export function SmartphoneIcon({
  className = 'icon icon-sm',
  color = 'currentColor',
  ariaHidden = true,
  ...props
}) {
  return (
    <Smartphone
      className={className}
      color={color}
      strokeWidth={2}
      aria-hidden={ariaHidden}
      {...props}
    />
  );
}
