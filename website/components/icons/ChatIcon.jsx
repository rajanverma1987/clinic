/**
 * Chat icon – Lucide React. Use for messages, chat, comments.
 */
import { MessageCircle } from 'lucide-react';

export function ChatIcon({
  className = 'icon icon-sm',
  color = 'currentColor',
  ariaHidden = true,
  ...props
}) {
  return (
    <MessageCircle
      className={className}
      color={color}
      strokeWidth={2}
      aria-hidden={ariaHidden}
      {...props}
    />
  );
}
