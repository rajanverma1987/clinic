'use client';

import { useEffect } from 'react';

export function Modal({ isOpen, onClose, title, children, size = 'lg' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full',
    print: 'max-w-[794px]', // A4 width at 96 DPI (~210mm)
  };

  return (
    <div
      className='fixed inset-0 z-50 overflow-y-auto'
      onClick={onClose}
      style={{
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      {/* Backdrop */}
      <div
        className='fixed inset-0 bg-black/50 backdrop-blur-sm'
        style={{
          animation: 'fadeIn 0.2s ease-out',
        }}
      />

      {/* Modal Content */}
      <div className='flex min-h-screen items-center justify-center p-4'>
        <div
          className={`relative bg-white rounded-2xl shadow-2xl w-full border border-neutral-200 ${sizeClasses[size]}`}
          onClick={(e) => e.stopPropagation()}
          style={{
            animation: 'slideUp 0.3s ease-out',
          }}
        >
          {title && (
            <div className='flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50/50 rounded-t-2xl'>
              <h2
                className='text-neutral-900 font-semibold'
                style={{
                  fontSize: '20px',
                  lineHeight: '28px',
                  letterSpacing: '-0.01em',
                  fontWeight: '600',
                }}
              >
                {title}
              </h2>
              <button
                onClick={onClose}
                className='text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-all duration-200 flex items-center justify-center'
                style={{
                  width: '32px',
                  height: '32px',
                }}
                aria-label='Close modal'
              >
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </button>
            </div>
          )}
          <div className={title ? 'p-6' : 'p-0'}>{children}</div>
        </div>
      </div>
    </div>
  );
}
