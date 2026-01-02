import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/tv-secret'],
      },
    ],
    sitemap: 'https://www.free-epg.de/sitemap.xml',
  };
}
