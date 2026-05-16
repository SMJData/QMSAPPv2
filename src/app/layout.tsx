import type { Metadata, Viewport } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets:  ["latin"],
  variable: "--font-inter",
  display:  "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets:  ["latin"],
  weight:   ["400", "500"],
  variable: "--font-ibm-plex-mono",
  display:  "swap",
});

export const metadata: Metadata = {
  title: "Production Logger | S.M. Jaleel & Co.",
  description: "Shift production and downtime logging for S.M. Jaleel & Company",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SMJ Logger",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#004182",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${ibmPlexMono.variable}`}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}