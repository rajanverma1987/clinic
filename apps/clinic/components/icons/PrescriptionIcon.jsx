/**
 * Prescription icon – Lucide React. Use for prescriptions, medical documents.
 */
import { Pill } from 'lucide-react';

export function PrescriptionIcon({
  className = 'icon icon-sm',
  color = 'currentColor',
  ariaHidden = true,
  ...props
}) {
  return (
    <Pill
      className={className}
      color={color}
      strokeWidth={2}
      aria-hidden={ariaHidden}
      {...props}
    />
  );
}
