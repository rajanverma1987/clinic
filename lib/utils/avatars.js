/**
 * Avatar placeholder helpers: initials and deterministic color from name.
 * Use when no avatar URL is available.
 */

const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-yellow-500',
  'bg-red-500',
];

/**
 * Get initials and Tailwind color class for an avatar placeholder.
 *
 * @param {string} name - Full name (e.g. "Jane Doe")
 * @returns {{ initials: string, color: string }}
 */
export function getAvatarPlaceholder(name) {
  if (!name || typeof name !== 'string') {
    return { initials: '?', color: AVATAR_COLORS[0] };
  }

  const initials = name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const colorIndex = name.trim().charCodeAt(0) % AVATAR_COLORS.length;
  return {
    initials: initials || '?',
    color: AVATAR_COLORS[colorIndex] || AVATAR_COLORS[0],
  };
}
