import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { I18nProvider } from "@/contexts/I18nContext";
import { FeatureProvider } from "@/contexts/FeatureContext";

export const metadata: Metadata = {
  title: "Clinic Management System",
  description: "Global-ready clinic management SaaS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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

