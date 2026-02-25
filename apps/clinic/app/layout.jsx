import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Providers } from '@/components/providers/Providers';
import { cookies } from 'next/headers';
import './globals.css';

/** Force dynamic rendering so pages using useSearchParams() do not require per-page Suspense during static export. */
export const dynamic = 'force-dynamic';

const LOCALE_COOKIE = 'NEXT_LOCALE';
const RTL_LOCALES = ['ar'];
const LOCALE_TO_LANG = { en: 'en-US', es: 'es-ES', ar: 'ar-SA' };
const SUPPORTED = ['en', 'es', 'ar'];

export const metadata = {
  title: 'Clinic Management System',
  description: 'Global-ready clinic management SaaS',
  icons: {
    icon: [{ url: '/images/faviconw.png', sizes: 'any', type: 'image/png' }],
  },
};

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get(LOCALE_COOKIE);
  const locale = localeCookie?.value && SUPPORTED.includes(localeCookie.value) ? localeCookie.value : 'en';
  const lang = LOCALE_TO_LANG[locale] || 'en-US';
  const dir = RTL_LOCALES.includes(locale) ? 'rtl' : 'ltr';

  return (
    <html lang={lang} dir={dir} suppressHydrationWarning>
      <head>
        <link rel='icon' href='/images/faviconw.png' type='image/png' />
        <script src='/chunk-recovery.js' />
        <script src='/theme-init.js' />
        <script src='/sw-register.js' async />
      </head>
      <body className='antialiased min-h-screen' suppressHydrationWarning>
        <ErrorBoundary variant='page' name='RootErrorBoundary'>
          <Providers>{children}</Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
