import { NextResponse } from 'next/server';
import { getCacheInfo, getAvailableCountries, getCountryConfig } from '@/lib/epg-service';

/**
 * API Route für Cache-Status Informationen
 * GET /api/epg/status?country=DE
 * 
 * Gibt Informationen über den aktuellen Cache-Status zurück.
 * 
 * Query Parameter:
 * - country: Länder-Code (z.B. DE, US, GB, etc.) - Standard: DE
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const countryCode = searchParams.get('country') || 'DE';
    
    const cacheInfo = getCacheInfo(countryCode);
    const config = getCountryConfig(countryCode);
    const revalidateSeconds = parseInt(
      process.env.EPG_REVALIDATE_SECONDS || '86400',
      10
    );

    // Kombiniere alle Quellen für die Anzeige
    const allSources = [...config.sources, ...config.fallbackSources];
    const uniqueSources = Array.from(
      new Map(allSources.map(source => [source.url, source])).values()
    );

    return NextResponse.json(
      {
        country: {
          code: config.code,
          name: config.name,
        },
        cache: {
          active: cacheInfo.cached,
          age: cacheInfo.age,
          ageFormatted: cacheInfo.ageFormatted,
          revalidateSeconds,
        },
        sources: uniqueSources.map((source, idx) => ({
          name: `${config.name} EPG Source ${idx + 1}`,
          url: source.url,
          type: source.compressed ? 'xml.gz' : 'xml',
          priority: config.sources.some(s => s.url === source.url) ? 'primary' : 'fallback',
          provider: source.url.includes('epghub.xyz') ? 'EPGHub' : 
                   source.url.includes('globetvapp') ? 'GlobeTV' :
                   source.url.includes('epgshare01') ? 'EPGShare' : 'Unknown',
        })),
        info: {
          totalSources: uniqueSources.length,
          primarySources: config.sources.length,
          fallbackSources: config.fallbackSources.length,
          combined: true,
          description: 'Alle Quellen werden zu einer vereinten XML-Ausgabe kombiniert',
        },
        availableCountries: getAvailableCountries(),
        endpoints: {
          epg: `/api/epg?country=${countryCode}`,
          status: `/api/epg/status?country=${countryCode}`,
          refresh: `/api/epg/refresh?country=${countryCode}`,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] Fehler beim Abrufen des Status:', error);

    return NextResponse.json(
      {
        error: 'Fehler beim Abrufen des Status',
        message: error instanceof Error ? error.message : 'Unbekannter Fehler',
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';

