'use client';

import { OptimizedImage } from '@/components/common/OptimizedImage';
import { getAvatarPlaceholder } from '@/lib/utils/avatars';

/**
 * Avatar: image with fallback to initials placeholder.
 *
 * @param {object} props
 * @param {string} [props.src] - Avatar image URL (optional)
 * @param {string} props.name - Display name (for alt and initials fallback)
 * @param {number} [props.size=40] - Width/height in px
 * @param {string} [props.className] - Extra classes for the wrapper
 */
export function Avatar({ src, name, size = 40, className = '' }) {
  const placeholder = getAvatarPlaceholder(name ?? '');

  if (src) {
    return (
      <div className={`relative shrink-0 overflow-hidden rounded-full ${className}`} style={{ width: size, height: size }}>
        <OptimizedImage
          src={src}
          alt={name ?? 'Avatar'}
          width={size}
          height={size}
          className='rounded-full object-cover'
          sizes={`${size}px`}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full text-white font-semibold ${placeholder.color} ${className}`}
      style={{ width: size, height: size, fontSize: Math.max(12, size * 0.4) }}
      aria-label={name ?? 'Avatar'}
    >
      {placeholder.initials}
    </div>
  );
}
