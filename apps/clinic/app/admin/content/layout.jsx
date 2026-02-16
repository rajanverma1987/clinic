'use client';

import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { ADMIN_CONTENT_CHILDREN } from '@/lib/constants/dashboard-structure';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminContentLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user && user.role !== 'super_admin') router.push('/dashboard');
  }, [authLoading, user, router]);

  if (authLoading || user?.role !== 'super_admin') return null;

  return (
    <Layout title={t('admin.contentManagement')} subtitle={t('admin.contentManagementSubtitle')}>
      <div className='admin-page-content'>
        <nav
          role='tablist'
          aria-label={t('admin.content')}
          className='w-full flex flex-wrap items-center gap-x-4 gap-y-1 overflow-x-auto scrollbar-hide py-1.5 border-b border-neutral-200 dark:border-neutral-600 mb-4'
        >
          {ADMIN_CONTENT_CHILDREN.map(({ path, labelKey }, index) => {
            const normalizedPath = path.replace(/\/$/, '') || '/';
            const normalizedPathname = (pathname || '').replace(/\/$/, '') || '/';
            const isIndex = normalizedPathname === '/admin/content';
            const isActive =
              normalizedPathname === normalizedPath ||
              (isIndex && index === 0) ||
              (normalizedPathname.startsWith(normalizedPath + '/') &&
                normalizedPath !== '/admin/content');
            return (
              <Link
                key={path}
                href={path}
                role='tab'
                aria-selected={isActive}
                aria-controls='admin-content-panel'
                id={`admin-content-tab-${index}`}
                className={
isActive
                  ? 'py-1.5 px-3 border-b-2 border-primary-500 text-primary-600 dark:text-primary-300 font-medium text-body-sm whitespace-nowrap'
                  : 'py-1.5 px-3 border-b-2 border-transparent text-neutral-500 dark:text-neutral-400 font-medium text-body-sm whitespace-nowrap hover:text-neutral-700 dark:hover:text-neutral-200'
                }
              >
                {t(labelKey)}
              </Link>
            );
          })}
        </nav>
        <div
          id='admin-content-panel'
          role='tabpanel'
          aria-labelledby={(() => {
            const i = ADMIN_CONTENT_CHILDREN.findIndex(
              (c) => (pathname || '').replace(/\/$/, '') === (c.path || '').replace(/\/$/, ''),
            );
            return i >= 0 ? `admin-content-tab-${i}` : undefined;
          })()}
        >
          {children}
        </div>
      </div>
    </Layout>
  );
}
