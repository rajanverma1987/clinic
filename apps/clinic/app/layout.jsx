import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Providers } from '@/components/providers/Providers';
import './globals.css';

/** Force dynamic rendering so pages using useSearchParams() do not require per-page Suspense during static export. */
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Clinic Management System',
  description: 'Global-ready clinic management SaaS',
  icons: {
    icon: [{ url: '/images/faviconw.png', sizes: 'any', type: 'image/png' }],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        <link rel='icon' href='/images/faviconw.png' type='image/png' />
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
