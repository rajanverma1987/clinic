/**
 * Warning icon – Lucide React. Use for alerts, caution, attention.
 */
import { AlertTriangle } from 'lucide-react';

export function WarningIcon({
  className = 'icon icon-sm',
  color = 'currentColor',
  ariaHidden = true,
  ...props
}) {
  return (
    <AlertTriangle
      className={className}
      color={color}
      strokeWidth={2}
      aria-hidden={ariaHidden}
      {...props}
    />
  );
}
