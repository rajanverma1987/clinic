/**
 * Document icon – Lucide React. Use for reports, files, prescriptions.
 */
import { FileText } from 'lucide-react';

export function DocumentIcon({
  className = 'icon icon-sm',
  color = 'currentColor',
  ariaHidden = true,
  ...props
}) {
  return (
    <FileText
      className={className}
      color={color}
      strokeWidth={2}
      aria-hidden={ariaHidden}
      {...props}
    />
  );
}
