'use client';

import { useState } from 'react';

export function BlogImage({ src, alt, className, loading = 'lazy', caption }) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      // Fallback to placeholder
      setImgSrc(`https://via.placeholder.com/800x450/3B82F6/FFFFFF?text=${encodeURIComponent(alt?.substring(0, 40) || 'Image')}`);
    }
  };

  return (
    <>
      <img
        src={imgSrc}
        alt={alt}
        className={className}
        loading={loading}
        onError={handleError}
      />
      {caption && (
        <p className="text-sm text-gray-600 italic mt-2 text-center">
          {caption}
        </p>
      )}
    </>
  );
}
