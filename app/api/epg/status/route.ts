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
        sources: config.sources.map((source) => ({
          name: `${config.name} EPG Source`,
          url: source.url,
          type: source.compressed ? 'xml.gz' : 'xml',
          priority: 'primary',
        })),
        fallbackSources: config.fallbackSources.map((source) => ({
          name: `${config.name} EPG Fallback`,
          url: source.url,
          type: source.compressed ? 'xml.gz' : 'xml',
          priority: 'fallback',
        })),
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

