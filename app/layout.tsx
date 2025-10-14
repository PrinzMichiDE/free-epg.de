import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EPG Service - Electronic Program Guide API',
  description: 'Moderner EPG Service mit Multi-Source Support, intelligentes Mergen von EPG-Daten und täglicher Aktualisierung. Optimiert für Vercel.',
  keywords: ['EPG', 'Electronic Program Guide', 'XML', 'API', 'TV Guide', 'Germany'],
  authors: [{ name: 'EPG Service' }],
  openGraph: {
    title: 'EPG Service',
    description: 'Electronic Program Guide API Service',
    type: 'website',
  },
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#10b981',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className="antialiased">{children}</body>
    </html>
  );
}

