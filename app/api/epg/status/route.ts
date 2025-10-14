import { NextResponse } from 'next/server';
import { getCacheInfo } from '@/lib/epg-service';

/**
 * API Route für Cache-Status Informationen
 * GET /api/epg/status
 * 
 * Gibt Informationen über den aktuellen Cache-Status zurück.
 */
export async function GET() {
  try {
    const cacheInfo = getCacheInfo();
    const revalidateSeconds = parseInt(
      process.env.EPG_REVALIDATE_SECONDS || '86400',
      10
    );

    return NextResponse.json(
      {
        cache: {
          active: cacheInfo.cached,
          age: cacheInfo.age,
          ageFormatted: cacheInfo.ageFormatted,
          revalidateSeconds,
        },
        sources: [
          {
            name: 'GlobeTV Germany EPG',
            url: 'https://raw.githubusercontent.com/globetvapp/epg/refs/heads/main/Germany/germany1.xml',
            type: 'xml',
          },
          {
            name: 'EPGShare DE1',
            url: 'https://epgshare01.online/epgshare01/epg_ripper_DE1.xml.gz',
            type: 'xml.gz',
          },
        ],
        endpoints: {
          epg: '/api/epg',
          status: '/api/epg/status',
          refresh: '/api/epg/refresh',
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

