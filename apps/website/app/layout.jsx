import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider } from '@/contexts/AuthContext';
import { I18nProvider } from '@/contexts/I18nContext';
import './globals.css';

export const metadata = {
  title: "Doctor's Clinic | Clinic Management",
  description: 'Clinic management for healthcare professionals',
  icons: {
    icon: [{ url: '/images/faviconw.webp', sizes: 'any', type: 'image/webp' }],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <head>
        <link rel='icon' href='/images/faviconw.webp' type='image/webp' />
      </head>
      <body>
        <AuthProvider>
          <I18nProvider>
            <ErrorBoundary name='RootErrorBoundary'>{children}</ErrorBoundary>
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
