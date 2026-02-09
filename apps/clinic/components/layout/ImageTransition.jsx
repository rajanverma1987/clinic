'use client';

import Image from 'next/image';

export function ImageTransition({
  src,
  alt,
  width,
  height,
  fill,
  className = '',
  priority = false,
  quality = 75,
  sizes,
  style,
  ...props
}) {
  if (fill) {
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
        }}
        className={className}
      >
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          quality={quality}
          sizes={sizes}
          style={{ ...style, objectFit: 'cover', objectPosition: 'center' }}
          className='object-cover'
          {...props}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'inline-block' }}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        quality={quality}
        sizes={sizes}
        style={style}
        className={className}
        {...props}
      />
    </div>
  );
}
