import { Metadata } from 'next';
import { locales, defaultLanguage, languages } from '@/lib/i18n';
import Script from 'next/script';
import '../globals.css';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = (localeParam || defaultLanguage) as keyof typeof languages;
  
  const metadata: Record<string, Metadata> = {
    de: {
      title: 'Kostenloser TV-Programm-Guide | EPG Service für IPTV Apps',
      description: 'Kostenloser EPG Service für IPTV Apps. Wähle dein Land, kopiere die URL und nutze sofort Programmübersichten für über 13 Länder weltweit. 100% kostenlos, täglich aktualisiert.',
      keywords: ['EPG', 'TV Programm', 'IPTV', 'Electronic Program Guide', 'kostenlos', 'Deutschland', 'TV Guide', 'Programmübersicht'],
      openGraph: {
        title: 'Kostenloser TV-Programm-Guide | EPG Service',
        description: 'Kostenloser EPG Service für IPTV Apps - Weltweite Abdeckung für über 13 Länder',
        type: 'website',
        locale: 'de_DE',
      },
      alternates: {
        languages: {
          'de': '/de',
          'en': '/en',
          'fr': '/fr',
          'es': '/es',
        },
      },
    },
    en: {
      title: 'Free TV Program Guide | EPG Service for IPTV Apps',
      description: 'Free EPG service for IPTV apps. Select your country, copy the URL and use program guides for over 13 countries worldwide. 100% free, updated daily.',
      keywords: ['EPG', 'TV Guide', 'IPTV', 'Electronic Program Guide', 'free', 'TV program', 'program guide'],
      openGraph: {
        title: 'Free TV Program Guide | EPG Service',
        description: 'Free EPG service for IPTV apps - Worldwide coverage for over 13 countries',
        type: 'website',
        locale: 'en_US',
      },
      alternates: {
        languages: {
          'de': '/de',
          'en': '/en',
          'fr': '/fr',
          'es': '/es',
        },
      },
    },
    fr: {
      title: 'Guide de programmes TV gratuit | Service EPG pour applications IPTV',
      description: 'Service EPG gratuit pour applications IPTV. Sélectionnez votre pays, copiez l\'URL et utilisez des guides de programmes pour plus de 13 pays dans le monde. 100% gratuit, mis à jour quotidiennement.',
      keywords: ['EPG', 'Guide TV', 'IPTV', 'Guide de programmes électronique', 'gratuit', 'Programme TV'],
      openGraph: {
        title: 'Guide de programmes TV gratuit | Service EPG',
        description: 'Service EPG gratuit pour applications IPTV - Couverture mondiale pour plus de 13 pays',
        type: 'website',
        locale: 'fr_FR',
      },
      alternates: {
        languages: {
          'de': '/de',
          'en': '/en',
          'fr': '/fr',
          'es': '/es',
        },
      },
    },
    es: {
      title: 'Guía de programas de TV gratuita | Servicio EPG para aplicaciones IPTV',
      description: 'Servicio EPG gratuito para aplicaciones IPTV. Selecciona tu país, copia la URL y usa guías de programas para más de 13 países en todo el mundo. 100% gratuito, actualizado diariamente.',
      keywords: ['EPG', 'Guía TV', 'IPTV', 'Guía de programas electrónica', 'gratis', 'Programa TV'],
      openGraph: {
        title: 'Guía de programas de TV gratuita | Servicio EPG',
        description: 'Servicio EPG gratuito para aplicaciones IPTV - Cobertura mundial para más de 13 países',
        type: 'website',
        locale: 'es_ES',
      },
      alternates: {
        languages: {
          'de': '/de',
          'en': '/en',
          'fr': '/fr',
          'es': '/es',
        },
      },
    },
  };

  return {
    ...metadata[locale] || metadata[defaultLanguage],
    metadataBase: new URL('https://www.free-epg.de'),
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = (localeParam || defaultLanguage) as keyof typeof languages;

  return (
    <html lang={locale}>
      <head>
        <link rel="apple-touch-icon" href="/apple-icon" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="canonical" href={`https://www.free-epg.de/${locale}`} />
        {locales.map((l) => (
          <link key={l} rel="alternate" hrefLang={l} href={`https://www.free-epg.de/${l}`} />
        ))}
        <link rel="alternate" hrefLang="x-default" href="https://www.free-epg.de/de" />
      </head>
      <body className="antialiased touch-manipulation">
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9024379936764895"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <Script
          src="https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1"
          strategy="afterInteractive"
        />
        {children}
      </body>
    </html>
  );
}
