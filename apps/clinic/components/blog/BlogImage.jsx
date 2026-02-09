'use client';

import Image from 'next/image';
import { useState } from 'react';

export function BlogImage({ src, alt, className, loading = 'lazy', caption }) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      // Fallback to placeholder
      setImgSrc(
        `https://via.placeholder.com/800x450/3B82F6/FFFFFF?text=${encodeURIComponent(
          alt?.substring(0, 40) || 'Image'
        )}`
      );
    }
  };

  if (hasError && imgSrc.includes('placeholder')) {
    return (
      <>
        <div
          className={`${className} bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-600 text-2xl font-bold rounded-lg`}
        >
          {alt?.substring(0, 40) || 'Image'}
        </div>
        {caption && <p className='text-sm text-neutral-600 italic mt-2 text-center'>{caption}</p>}
      </>
    );
  }

  return (
    <>
      <div
        className={className}
        style={{ position: 'relative', width: '100%', minHeight: '300px' }}
      >
        <Image
          src={imgSrc}
          alt={alt || ''}
          fill
          className='object-contain rounded-lg'
          loading={loading}
          onError={handleError}
          sizes='(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px'
          style={{ objectFit: 'contain' }}
        />
      </div>
      {caption && <p className='text-sm text-neutral-600 italic mt-2 text-center'>{caption}</p>}
    </>
  );
}
