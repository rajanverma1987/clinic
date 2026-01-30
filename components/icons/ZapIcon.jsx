/**
 * Zap icon – Lucide React. Use for lightning, quick action, trial.
 */
import { Zap } from 'lucide-react';

export function ZapIcon({
  className = 'icon icon-sm',
  color = 'currentColor',
  ariaHidden = true,
  ...props
}) {
  return (
    <Zap
      className={className}
      color={color}
      strokeWidth={2}
      aria-hidden={ariaHidden}
      {...props}
    />
  );
}
