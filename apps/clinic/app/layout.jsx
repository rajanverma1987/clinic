import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Providers } from '@/components/providers/Providers';
import './globals.css';

/** Force dynamic rendering so pages using useSearchParams() do not require per-page Suspense during static export. */
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Clinic Management System',
  description: 'Global-ready clinic management SaaS',
  icons: {
    icon: [
      { url: '/images/favicon_io/favicon.ico', sizes: 'any' },
      { url: '/images/favicon_io/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/images/favicon_io/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/images/favicon_io/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/images/favicon_io/site.webmanifest',
};

export default function RootLayout({ children }) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        <link rel='icon' href='/favicon.ico' sizes='any' />
        <link rel='icon' href='/images/favicon_io/favicon.ico' sizes='any' />
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
