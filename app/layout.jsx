import { Providers } from '@/components/providers/Providers';
import './globals.css';

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
        <script src='/sw-register.js' async />
      </head>
      <body className='antialiased min-h-screen bg-neutral-50' suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
