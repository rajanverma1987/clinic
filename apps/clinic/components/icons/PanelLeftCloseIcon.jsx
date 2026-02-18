import { PanelLeftClose } from 'lucide-react';

export function PanelLeftCloseIcon({
  className = 'icon icon-sm',
  color = 'currentColor',
  ariaHidden = true,
  ...props
}) {
  return (
    <PanelLeftClose
      className={className}
      color={color}
      strokeWidth={2}
      aria-hidden={ariaHidden}
      {...props}
    />
  );
}
