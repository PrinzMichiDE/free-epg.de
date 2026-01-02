import { NextResponse } from 'next/server';
import { getEpgData, getAvailableCountries } from '@/lib/epg-service';
import { incrementDownloads } from '@/lib/stats-service';
import { trackEpgDownload, trackApiError } from '@/lib/analytics';

/**
 * API Route Handler für EPG XML
 * GET /api/epg?country=DE
 * 
 * Liefert die EPG Daten als XML aus.
 * Die Daten werden täglich automatisch aktualisiert.
 * 
 * Query Parameter:
 * - country: Länder-Code (z.B. DE, US, GB, FR, etc.) - Standard: DE
 */
export async function GET(request: Request) {
  // User-Agent und IP für Statistiken extrahieren (immer, auch bei Fehlern)
  const userAgent = request.headers.get('user-agent');
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0] || realIP || null;
  
  try {
    const { searchParams } = new URL(request.url);
    const countryCode = searchParams.get('country') || 'DE';
    
    const xmlData = await getEpgData(countryCode);
    
    // Download-Counter inkrementieren mit Player-Erkennung (NACH erfolgreichem Laden)
    incrementDownloads(userAgent, ip).catch(err => {
      console.error('[API] Fehler beim Inkrementieren der Downloads:', err);
    });
    
    // Google Analytics Event senden (Client-Side)
    // Hinweis: Event wird im Client getrackt, da wir hier Server-Side sind
    // Wir fügen einen Header hinzu, der im Client ausgelesen werden kann
    
    // XML mit korrektem Content-Type zurückgeben
    // GA Event wird über Header an Client weitergegeben
    return new NextResponse(xmlData, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'X-GA-Event': 'epg_download',
        'X-GA-Country': countryCode,
        // Cache-Header für Browser/CDN (1 Stunde)
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    // Auch bei Fehlern tracken (für Statistiken über fehlgeschlagene Requests)
    incrementDownloads(userAgent, ip).catch(err => {
      console.error('[API] Fehler beim Inkrementieren der Downloads:', err);
    });
    
    console.error('[API] Fehler beim Abrufen der EPG Daten:', error);
    
    return NextResponse.json(
      {
        error: 'Fehler beim Laden der EPG Daten',
        message: error instanceof Error ? error.message : 'Unbekannter Fehler',
      },
      { status: 500 }
    );
  }
}

// Route als dynamisch markieren (für Vercel)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

