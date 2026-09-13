import type { Metadata, Viewport } from "next";
import { Inter, Manrope, Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { LanguageProvider } from "@/components/LanguageProvider";
import { getLocale } from "@/lib/i18n/locale";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DRISHTI",
  description: "Digital Reporting and Infrastructure Surveillance with Health Tracking Intelligence",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DRISHTI",
  },
  // No manual `icons` field — src/app/icon.svg and src/app/apple-icon.png
  // are Next's file-convention icons, already auto-linked.
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#eee8da",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale}>
      <body
        className={`${inter.variable} ${manrope.variable} ${bricolage.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <LanguageProvider initialLocale={locale}>
          <ServiceWorkerRegister />
          <Navbar />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
