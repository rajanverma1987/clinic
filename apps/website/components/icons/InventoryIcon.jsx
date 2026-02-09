/**
 * Inventory icon – Lucide React. Use for inventory, stock, packages.
 */
import { Package } from 'lucide-react';

export function InventoryIcon({
  className = 'icon icon-sm',
  color = 'currentColor',
  ariaHidden = true,
  ...props
}) {
  return (
    <Package
      className={className}
      color={color}
      strokeWidth={2}
      aria-hidden={ariaHidden}
      {...props}
    />
  );
}
