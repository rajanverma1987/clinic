/**
 * Languages icon – Lucide React. Use for i18n, multi-language.
 */
import { Languages } from 'lucide-react';

export function LanguagesIcon({
  className = 'icon icon-sm',
  color = 'currentColor',
  ariaHidden = true,
  ...props
}) {
  return (
    <Languages
      className={className}
      color={color}
      strokeWidth={2}
      aria-hidden={ariaHidden}
      {...props}
    />
  );
}
