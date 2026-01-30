'use client';

/**
 * Global Loader Component – uses clinic logo (/images/logoclinic.png)
 * Use this loader across the entire platform - no custom loaders allowed
 */
export function Loader({
  size = 'md',
  text, // Deprecated: kept for backward compatibility, not rendered
  fullScreen = false,
  className = '',
  variant = 'primary',
  inline = false,
}) {
  const sizeClasses = {
    xs: {
      spinner: 28,
      pulse: '44px',
      border: '2px',
    },
    sm: {
      spinner: 36,
      pulse: '56px',
      border: '2px',
    },
    md: {
      spinner: 44,
      pulse: '68px',
      border: '3px',
    },
    lg: {
      spinner: 56,
      pulse: '84px',
      border: '3px',
    },
    xl: {
      spinner: 68,
      pulse: '100px',
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

  const spinner = (
    <div
      className='relative flex-shrink-0 flex items-center justify-center'
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

      {/* Clinic logo (real branding) */}
      <div
        className='absolute inset-0 flex items-center justify-center'
        style={{
          animation: 'fade-pulse 2s ease-in-out infinite',
        }}
      >
        <img
          src='/images/logoclinic.png'
          alt=''
          width={currentSize.spinner}
          height={currentSize.spinner}
          className='object-contain'
          style={{
            width: currentSize.spinner,
            height: 'auto',
            maxHeight: currentSize.spinner,
            objectFit: 'contain',
            animation: 'logo-pulse 2s ease-in-out infinite',
          }}
        />
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
          zIndex: 1,
        }}
      >
        <div
          className='w-full h-full rounded-full'
          style={{
            borderWidth: currentSize.border,
            borderStyle: 'solid',
            borderTopColor: colors.main,
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
        {spinner}

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

  return (
    <div
      className={`flex items-center justify-center ${className}`}
    >
      {spinner}

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
