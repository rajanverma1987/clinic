'use client';

import { useI18n } from '@/contexts/I18nContext';
import Image from 'next/image';

/**
 * Premium Medical Loader Component for Healthcare Platform
 * Use this loader across the entire platform - no custom loaders allowed
 */
export function Loader({
  size = 'md',
  text,
  fullScreen = false,
  className = '',
  variant = 'primary',
  inline = false,
}) {
  const { t } = useI18n();

  const sizeClasses = {
    xs: {
      spinner: '20px',
      pulse: '32px',
      border: '2px',
    },
    sm: {
      spinner: '24px',
      pulse: '40px',
      border: '2px',
    },
    md: {
      spinner: '32px',
      pulse: '52px',
      border: '3px',
    },
    lg: {
      spinner: '40px',
      pulse: '64px',
      border: '3px',
    },
    xl: {
      spinner: '48px',
      pulse: '76px',
      border: '4px',
    },
  };

  const variantColors = {
    primary: {
      main: '#2D9CDB',
      light: 'rgba(45, 156, 219, 0.2)',
      pulse: 'rgba(45, 156, 219, 0.15)',
    },
    secondary: {
      main: '#27AE60',
      light: 'rgba(39, 174, 96, 0.2)',
      pulse: 'rgba(39, 174, 96, 0.15)',
    },
    neutral: {
      main: '#828282',
      light: 'rgba(130, 130, 130, 0.2)',
      pulse: 'rgba(130, 130, 130, 0.15)',
    },
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;
  const colors = variantColors[variant] || variantColors.primary;

  // Safe text retrieval with fallback
  let displayText = text;
  if (!displayText && t) {
    try {
      displayText = t('common.loading');
    } catch (error) {
      displayText = 'Loading...';
    }
  }
  if (!displayText) {
    displayText = 'Loading...';
  }

  const spinner = (
    <div
      className='relative flex-shrink-0'
      style={{
        width: currentSize.pulse,
        height: currentSize.pulse,
      }}
    >
      {/* Pulsing background for medical feel */}
      <div
        className='absolute inset-0 rounded-full'
        style={{
          background: colors.pulse,
          animation: 'medical-pulse 2s ease-in-out infinite',
        }}
      />

      {/* Clinic Logo in center */}
      <div
        className='absolute inset-0 flex items-center justify-center'
        style={{
          animation: 'fade-pulse 2s ease-in-out infinite',
        }}
      >
        <div
          style={{ position: 'relative', width: currentSize.spinner, height: currentSize.spinner }}
        >
          <Image
            src='/images/favicon_io/apple-touch-icon.png'
            alt='Loading'
            fill
            style={{
              objectFit: 'contain',
              animation: 'logo-pulse 2s ease-in-out infinite',
            }}
            unoptimized
          />
        </div>
      </div>

      {/* Blue spinning ring outside */}
      <div
        className='absolute'
        style={{
          top: '-4px',
          left: '-4px',
          right: '-4px',
          bottom: '-4px',
          width: `calc(${currentSize.pulse} + 8px)`,
          height: `calc(${currentSize.pulse} + 8px)`,
        }}
      >
        <div
          className='w-full h-full rounded-full'
          style={{
            borderWidth: currentSize.border,
            borderStyle: 'solid',
            borderTopColor: '#2D9CDB',
            borderRightColor: 'transparent',
            borderBottomColor: 'transparent',
            borderLeftColor: 'transparent',
            animation: 'medical-spin 1s linear infinite',
          }}
        />
      </div>
    </div>
  );

  if (inline) {
    return spinner;
  }

  if (fullScreen) {
    return (
      <div
        className={`fixed inset-0 flex items-center justify-center ${className}`}
        style={{
          zIndex: 'var(--z-loader, 10070)',
          background:
            'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(247, 250, 252, 0.98) 100%)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className='flex flex-col items-center' style={{ gap: '24px' }}>
          {spinner}
          {displayText && (
            <div className='flex flex-col items-center' style={{ gap: '8px' }}>
              <p
                className='font-semibold text-center'
                style={{
                  color: '#1A1A1A',
                  fontSize: '16px',
                  lineHeight: '24px',
                  letterSpacing: '-0.01em',
                }}
              >
                {displayText}
              </p>
              <div className='flex items-center' style={{ gap: '6px' }}>
                <div
                  className='w-2 h-2 rounded-full'
                  style={{
                    backgroundColor: colors.main,
                    animation: 'dot-bounce 1.4s infinite ease-in-out both',
                    animationDelay: '-0.32s',
                  }}
                />
                <div
                  className='w-2 h-2 rounded-full'
                  style={{
                    backgroundColor: colors.main,
                    animation: 'dot-bounce 1.4s infinite ease-in-out both',
                    animationDelay: '-0.16s',
                  }}
                />
                <div
                  className='w-2 h-2 rounded-full'
                  style={{
                    backgroundColor: colors.main,
                    animation: 'dot-bounce 1.4s infinite ease-in-out both',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <style jsx>{`
          @keyframes medical-spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }

          @keyframes medical-pulse {
            0%,
            100% {
              transform: scale(1);
              opacity: 0.3;
            }
            50% {
              transform: scale(1.1);
              opacity: 0.6;
            }
          }

          @keyframes logo-pulse {
            0%,
            100% {
              opacity: 0.9;
              transform: scale(1);
            }
            50% {
              opacity: 1;
              transform: scale(1.05);
            }
          }

          @keyframes fade-pulse {
            0%,
            100% {
              opacity: 0.8;
            }
            50% {
              opacity: 1;
            }
          }

          @keyframes dot-bounce {
            0%,
            80%,
            100% {
              transform: scale(0);
              opacity: 0.5;
            }
            40% {
              transform: scale(1);
              opacity: 1;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center ${className}`}
      style={{ gap: '16px' }}
    >
      {spinner}
      {displayText && (
        <p
          className='text-neutral-700 font-medium text-center'
          style={{
            fontSize: '14px',
            lineHeight: '20px',
          }}
        >
          {displayText}
        </p>
      )}

      <style jsx>{`
        @keyframes medical-spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes medical-pulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.6;
          }
        }

        @keyframes logo-pulse {
          0%,
          100% {
            opacity: 0.9;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
        }

        @keyframes fade-pulse {
          0%,
          100% {
            opacity: 0.8;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Compact inline loader for buttons and small spaces
 * Use this for inline loading states (buttons, small components)
 */
export function CompactLoader({ size = 'sm', className = '', variant = 'primary' }) {
  const sizeMap = {
    xs: '16px',
    sm: '20px',
    md: '24px',
    lg: '32px',
  };

  const variantColors = {
    primary: '#2D9CDB',
    secondary: '#27AE60',
    neutral: '#828282',
    white: '#ffffff',
  };

  const spinnerColor = variantColors[variant] || variantColors.primary;

  return (
    <div
      className={`inline-flex items-center justify-center ${className}`}
      style={{
        width: sizeMap[size] || sizeMap.sm,
        height: sizeMap[size] || sizeMap.sm,
      }}
    >
      <div
        className='rounded-full'
        style={{
          width: '100%',
          height: '100%',
          borderWidth: '2px',
          borderStyle: 'solid',
          borderTopColor: spinnerColor,
          borderRightColor: spinnerColor,
          borderBottomColor: 'transparent',
          borderLeftColor: 'transparent',
          animation: 'compact-spin 0.8s linear infinite',
        }}
      />

      <style jsx>{`
        @keyframes compact-spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
