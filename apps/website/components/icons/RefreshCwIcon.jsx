import { RefreshCw } from 'lucide-react';

/**
 * Refresh / reload – standard circular arrows. Use for refresh, reload, sync.
 */
export function RefreshCwIcon({
  className = 'icon icon-sm',
  color = 'currentColor',
  size = 20,
  ariaHidden = true,
  ...props
}) {
  return (
    <RefreshCw
      className={className}
      color={color}
      size={size}
      strokeWidth={2}
      aria-hidden={ariaHidden}
      {...props}
    />
  );
}
