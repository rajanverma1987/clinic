'use client';

import Image from 'next/image';
import { useState } from 'react';

/** Minimal 1x1 gray pixel for blur placeholder (avoids layout shift) */
const BLUR_DATA_URL =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBEQACEQAD8Acn/9k=';

/**
 * Next.js Image with loading skeleton, optional priority, and responsive sizes.
 * Use priority={true} only for above-the-fold images (e.g. hero).
 */
const DEFAULT_SIZES = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw';

export function OptimizedImage({
  src,
  alt,
  priority = false,
  quality = 75,
  className = '',
  sizes,
  ...props
}) {
  const [isLoading, setIsLoading] = useState(true);

  const useBlur = typeof src === 'string' && (src.startsWith('/') || src.startsWith('data:'));
  const blurDataURL = useBlur ? BLUR_DATA_URL : undefined;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && (
        <div
          className='absolute inset-0 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700'
          aria-hidden
        />
      )}
      <Image
        src={src}
        alt={alt ?? ''}
        priority={priority}
        loading={priority ? 'eager' : 'lazy'}
        quality={quality}
        placeholder={blurDataURL ? 'blur' : 'empty'}
        blurDataURL={blurDataURL}
        onLoad={() => setIsLoading(false)}
        sizes={sizes ?? DEFAULT_SIZES}
        {...props}
      />
    </div>
  );
}
