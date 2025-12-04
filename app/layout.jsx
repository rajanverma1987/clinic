import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { I18nProvider } from "@/contexts/I18nContext";
import { FeatureProvider } from "@/contexts/FeatureContext";

export const metadata = {
  title: "Clinic Management System",
  description: "Global-ready clinic management SaaS",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <I18nProvider>
            <FeatureProvider>
              {children}
            </FeatureProvider>
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

