/**
 * File down / download icon – Lucide React. Use for download, export PDF.
 */
import { FileDown } from 'lucide-react';

export function FileDownIcon({
  className = 'icon icon-sm',
  color = 'currentColor',
  ariaHidden = true,
  ...props
}) {
  return (
    <FileDown
      className={className}
      color={color}
      strokeWidth={2}
      aria-hidden={ariaHidden}
      {...props}
    />
  );
}
