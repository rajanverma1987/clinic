'use client';

import { ChevronRightIcon } from '@/components/icons';
import { useI18n } from '@/contexts/I18nContext';
import Link from 'next/link';

/**
 * Compact breadcrumb bar: single line, text-xs, chevron separators.
 * Use below page header for tab/section context.
 *
 * @param {{ items: Array<{ label: string; href?: string; onClick?: () => void }> }} props
 */
export function Breadcrumb({ items = [] }) {
  const { t } = useI18n();
  if (!items?.length) return null;

  return (
    <nav className='breadcrumb-bar' aria-label={t('common.ariaLabelBreadcrumb')}>
      <ol className='breadcrumb-bar__list'>
        {items.map((item, index) => (
          <li key={index} className='breadcrumb-bar__item'>
            {index > 0 && <ChevronRightIcon className='breadcrumb-bar__separator' ariaHidden />}
            {item.href ? (
              <Link
                href={item.href}
                className='breadcrumb-bar__link'
                onClick={(e) => {
                  if (item.onClick) {
                    e.preventDefault();
                    item.onClick();
                  }
                }}
              >
                {item.label}
              </Link>
            ) : (
              <span className='breadcrumb-bar__current'>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
