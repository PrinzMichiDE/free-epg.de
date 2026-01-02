import { MetadataRoute } from 'next';
import { locales } from '@/lib/i18n';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.free-epg.de';
  
  const routes = [
    '',
    '/de',
    '/en',
    '/fr',
    '/es',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '/de' || route === '' ? 1.0 : 0.8,
  }));
}
