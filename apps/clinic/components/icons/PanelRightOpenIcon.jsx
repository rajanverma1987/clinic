import { PanelRightOpen } from 'lucide-react';

export function PanelRightOpenIcon({
  className = 'icon icon-sm',
  color = 'currentColor',
  ariaHidden = true,
  ...props
}) {
  return (
    <PanelRightOpen
      className={className}
      color={color}
      strokeWidth={2}
      aria-hidden={ariaHidden}
      {...props}
    />
  );
}
