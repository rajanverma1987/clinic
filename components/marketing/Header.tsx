'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useI18n } from '@/contexts/I18nContext';

export function Header() {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">{t('common.appName')}</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/#features"
              className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
            >
              {t('navigation.features')}
            </Link>
            <Link
              href="/pricing"
              className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
            >
              Pricing
            </Link>
            <Link
              href="/support"
              className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
            >
              {t('navigation.support')}
            </Link>
            <Link
              href="/support/contact"
              className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
            >
              {t('navigation.contact')}
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/login')}
              className="whitespace-nowrap"
            >
              {t('auth.login')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => router.push('/register')}
              className="whitespace-nowrap"
            >
              {t('navigation.getStarted')}
            </Button>
          </div>
        </div>
      </nav>
    </header>
  );
}

