'use client';

import { Button } from '@/components/ui/Button';
import { useI18n } from '@/contexts/I18nContext';
import { useSettings } from '@/hooks/useSettings';

/**
 * PageHeader - Consistent header component for all pages
 * Follows the design system with premium styling
 */
export function PageHeader({
  title,
  subtitle,
  description,
  actionButton,
  actionButtons,
  breadcrumbs,
  icon,
  className = '',
}) {
  const { t } = useI18n();
  const { locale } = useSettings();

  return (
    <div
      className={`bg-white rounded-[10px] border-2 border-neutral-100 relative shadow-lg ${className}`}
      style={{
        overflow: 'visible',
        padding: '12px 12px 12px 10px',
        background:
          'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(247, 250, 252, 0.98) 100%)',
        zIndex: 'var(--z-sticky-header, 21)',
        position: 'sticky',
        top: 0,
        isolation: 'isolate',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        margin: '0 0 16px 0',
      }}
    >
      {/* Premium Background Pattern */}
      <div
        className='absolute inset-0 opacity-[0.02]'
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%232D9CDB' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>

      <div className='relative'>
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className='mb-3 text-sm text-neutral-600 flex items-center gap-2'>
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className='flex items-center gap-2'>
                {index > 0 && <span className='text-neutral-400'>/</span>}
                {crumb.href ? (
                  <a
                    href={crumb.href}
                    className='hover:text-primary-600 transition-colors'
                    onClick={(e) => {
                      if (crumb.onClick) {
                        e.preventDefault();
                        crumb.onClick();
                      }
                    }}
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span className={index === breadcrumbs.length - 1 ? 'text-neutral-900 font-medium' : ''}>
                    {crumb.label}
                  </span>
                )}
              </div>
            ))}
          </nav>
        )}

        {/* Main Header Content */}
        <div
          className='flex flex-col sm:flex-row sm:items-center sm:justify-between'
          style={{
            gap: 'var(--gap-6)',
          }}
        >
          {/* Left Section - Title and Description */}
          <div className='flex-1'>
            <div className='flex items-center gap-3 mb-2'>
              {/* Medical Icon Accent */}
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  background: 'linear-gradient(135deg, #2D9CDB 0%, #56CCF2 100%)',
                  borderRadius: '50%',
                  boxShadow: '0 0 8px rgba(45, 156, 219, 0.4)',
                }}
              ></div>
              
              {/* Icon (optional) */}
              {icon && (
                <div 
                  className='text-primary-600 flex items-center justify-center' 
                  style={{ 
                    fontSize: '24px',
                    width: '28px',
                    height: '28px',
                    minWidth: '28px',
                    minHeight: '28px'
                  }}
                >
                  {icon}
                </div>
              )}

              <h1
                className='text-neutral-900'
                style={{
                  fontSize: '32px',
                  lineHeight: '40px',
                  letterSpacing: '-0.02em',
                  fontWeight: '800',
                }}
              >
                {title}
              </h1>
            </div>

            {/* Subtitle or Description */}
            {(subtitle || description) && (
              <div className='flex items-center gap-2' style={{ marginLeft: '22px' }}>
                {subtitle && (
                  <div
                    className='text-neutral-600'
                    style={{
                      fontSize: 'var(--text-body-md)',
                      lineHeight: 'var(--text-body-md-line-height)',
                      fontWeight: '500',
                    }}
                  >
                    {subtitle}
                  </div>
                )}
                {description && (
                  <p
                    className='text-neutral-500'
                    style={{
                      fontSize: 'var(--text-body-sm)',
                      lineHeight: 'var(--text-body-sm-line-height)',
                    }}
                  >
                    {description}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right Section - Action Buttons */}
          {(actionButton || (actionButtons && actionButtons.length > 0)) && (
            <div
              className='flex items-center'
              style={{ gap: 'var(--gap-3)' }}
            >
              {actionButton}
              {actionButtons &&
                actionButtons.map((btn, index) => (
                  <div key={index}>{btn}</div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

