import type { Metadata } from "next";
import { Inter, Manrope, Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import NavbarGate from "@/components/NavbarGate";

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${manrope.variable} ${bricolage.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <NavbarGate>
          <Navbar />
        </NavbarGate>
        {children}
      </body>
    </html>
  );
}
