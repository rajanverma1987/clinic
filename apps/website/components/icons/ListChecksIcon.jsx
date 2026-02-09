/**
 * List with checkmarks – for completed items, show/hide completed lists.
 * Lucide React ListChecks. Use for queue "Show Completed", checklists, done items.
 */
import { ListChecks } from 'lucide-react';

export function ListChecksIcon({
  className = 'icon icon-sm',
  color = 'currentColor',
  ariaHidden = true,
  ...props
}) {
  return (
    <ListChecks
      className={className}
      color={color}
      strokeWidth={2}
      aria-hidden={ariaHidden}
      {...props}
    />
  );
}
