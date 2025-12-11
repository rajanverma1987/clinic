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
      className='fixed inset-0 overflow-y-auto'
      onClick={onClose}
      style={{
        animation: 'fadeIn 0.2s ease-out',
        zIndex: 'var(--z-modal, 50)',
      }}
    >
      {/* Premium Backdrop with blur */}
      <div
        className='fixed inset-0'
        style={{
          background:
            'linear-gradient(135deg, rgba(45, 156, 219, 0.05) 0%, rgba(39, 174, 96, 0.05) 100%), rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(8px)',
          animation: 'fadeIn 0.2s ease-out',
          zIndex: 'var(--z-modal-backdrop, 40)',
        }}
      />

      {/* Modal Content */}
      <div
        className='flex min-h-screen items-center justify-center p-4'
        style={{ zIndex: 'var(--z-modal, 50)' }}
      >
        <div
          className={`relative bg-white rounded-xl w-full border-2 border-neutral-100 ${sizeClasses[size]}`}
          onClick={(e) => e.stopPropagation()}
          style={{
            animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(45, 156, 219, 0.1)',
            zIndex: 'var(--z-modal, 50)',
          }}
        >
          {title && (
            <div
              className='flex items-center justify-between px-6 py-5 border-b-2 border-neutral-100 rounded-t-xl'
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f7fafc 100%)',
              }}
            >
              <h2
                className='text-neutral-900 font-bold flex items-center gap-2'
                style={{
                  fontSize: '20px',
                  lineHeight: '28px',
                  letterSpacing: '-0.01em',
                }}
              >
                {/* Medical icon accent */}
                <div
                  className='w-8 h-8 rounded-lg flex items-center justify-center'
                  style={{
                    background: 'linear-gradient(135deg, #2D9CDB 0%, #56CCF2 100%)',
                  }}
                >
                  <svg className='w-4 h-4 text-white' fill='currentColor' viewBox='0 0 20 20'>
                    <path
                      fillRule='evenodd'
                      d='M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a18.87 18.87 0 01-1.724 4.78c.29.354.596.696.914 1.026a1 1 0 11-1.44 1.389c-.188-.196-.373-.396-.554-.6a19.098 19.098 0 01-3.107 3.567 1 1 0 01-1.334-1.49 17.087 17.087 0 003.13-3.733 18.992 18.992 0 01-1.487-2.494 1 1 0 111.79-.89c.234.47.489.928.764 1.372.417-.934.752-1.913.997-2.927H3a1 1 0 110-2h3V3a1 1 0 011-1zm6 6a1 1 0 01.894.553l2.991 5.982a.869.869 0 01.02.037l.99 1.98a1 1 0 11-1.79.895L15.383 16h-4.764l-.724 1.447a1 1 0 11-1.788-.894l.99-1.98.019-.038 2.99-5.982A1 1 0 0113 8zm-1.382 6h2.764L13 11.236 11.618 14z'
                      clipRule='evenodd'
                    />
                  </svg>
                </div>
                {title}
              </h2>
              <button
                onClick={onClose}
                className='text-neutral-400 hover:text-white hover:bg-status-error rounded-lg transition-all duration-200 flex items-center justify-center group'
                style={{
                  width: '36px',
                  height: '36px',
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

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
