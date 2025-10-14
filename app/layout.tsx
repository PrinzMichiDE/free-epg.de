import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EPG Service - Electronic Program Guide API',
  description: 'Moderner EPG Service mit Multi-Source Support, Live TV Player und täglicher Aktualisierung. Optimiert für Vercel.',
  keywords: ['EPG', 'Electronic Program Guide', 'XML', 'API', 'TV Guide', 'Germany', 'IPTV', 'Live TV'],
  authors: [{ name: 'EPG Service' }],
  manifest: '/manifest.json',
  openGraph: {
    title: 'EPG Service',
    description: 'Electronic Program Guide API Service mit Live TV',
    type: 'website',
  },
  themeColor: '#10b981',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'EPG Service',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#10b981',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <head>
        <link rel="apple-touch-icon" href="/apple-icon" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="antialiased touch-manipulation">{children}</body>
    </html>
  );
}

