import { I18nProvider } from '@/contexts/I18nContext';
import './globals.css';

export const metadata = {
  title: "Doctor's Clinic | Clinic Management",
  description: 'Clinic management for healthcare professionals',
};

export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
