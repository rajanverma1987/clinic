/**
 * Printer icon – Lucide React. Use for print actions.
 */
import { Printer } from 'lucide-react';

export function PrinterIcon({
  className = 'icon icon-sm',
  color = 'currentColor',
  ariaHidden = true,
  ...props
}) {
  return (
    <Printer
      className={className}
      color={color}
      strokeWidth={2}
      aria-hidden={ariaHidden}
      {...props}
    />
  );
}
