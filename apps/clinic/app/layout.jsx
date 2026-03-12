import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Providers } from '@/components/providers/Providers';
import './globals.css';

/** Client-side rendering: no request-time server data; locale/lang/dir applied on client via DocumentLocale. */
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
    <html lang='en' dir='ltr' suppressHydrationWarning>
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
