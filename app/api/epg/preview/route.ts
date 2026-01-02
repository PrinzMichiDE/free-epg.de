import { NextResponse } from 'next/server';
import { getEpgData } from '@/lib/epg-service';
import { XMLParser } from 'fast-xml-parser';

/**
 * API Route für EPG Preview Daten
 * GET /api/epg/preview?country=DE&limit=10
 * 
 * Gibt eine Vorschau der EPG-Daten zurück mit aktuellen Programmen.
 * 
 * Query Parameter:
 * - country: Länder-Code (z.B. DE, US, GB, etc.) - Standard: DE
 * - limit: Anzahl der Programme pro Kanal - Standard: 5
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const countryCode = searchParams.get('country') || 'DE';
    const limit = parseInt(searchParams.get('limit') || '5', 10);
    
    const xmlData = await getEpgData(countryCode);
    
    // XML parsen
    const parserOptions = {
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseAttributeValue: false,
      trimValues: true,
    };
    
    const parser = new XMLParser(parserOptions);
    const parsed = parser.parse(xmlData);
    
    if (!parsed || !parsed.tv) {
      throw new Error('Ungültige EPG-Daten');
    }
    
    // Channels extrahieren
    const channels = Array.isArray(parsed.tv.channel) 
      ? parsed.tv.channel 
      : parsed.tv.channel ? [parsed.tv.channel] : [];
    
    // Programme extrahieren
    const programmes = Array.isArray(parsed.tv.programme)
      ? parsed.tv.programme
      : parsed.tv.programme ? [parsed.tv.programme] : [];
    
    // Aktuelle Zeit
    const now = new Date();
    const nowTimestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0];
    
    // Programme nach Kanal gruppieren und filtern (nur aktuelle und kommende)
    const programmesByChannel: Record<string, any[]> = {};
    
    programmes.forEach((programme: any) => {
      const channelId = programme['@_channel'];
      const startTime = programme['@_start'];
      
      // Nur Programme ab jetzt oder in der nahen Zukunft
      if (startTime >= nowTimestamp) {
        if (!programmesByChannel[channelId]) {
          programmesByChannel[channelId] = [];
        }
        programmesByChannel[channelId].push(programme);
      }
    });
    
    // Sortiere Programme nach Start-Zeit pro Kanal
    Object.keys(programmesByChannel).forEach(channelId => {
      programmesByChannel[channelId].sort((a, b) => 
        (a['@_start'] || '').localeCompare(b['@_start'] || '')
      );
    });
    
    // Erstelle Preview-Daten
    const previewData = channels.slice(0, 20).map((channel: any) => {
      const channelId = channel['@_id'];
      const channelName = Array.isArray(channel['display-name'])
        ? channel['display-name'][0]
        : typeof channel['display-name'] === 'string'
        ? channel['display-name']
        : channel['display-name']?.['#text'] || channelId;
      
      const channelProgrammes = (programmesByChannel[channelId] || [])
        .slice(0, limit)
        .map((prog: any) => {
          const title = typeof prog.title === 'string' 
            ? prog.title 
            : prog.title?.['#text'] || 'Unbekannt';
          
          const desc = typeof prog.desc === 'string'
            ? prog.desc
            : prog.desc?.['#text'] || '';
          
          const category = Array.isArray(prog.category)
            ? prog.category[0]
            : prog.category || '';
          
          // Parse Start-Zeit
          const startTime = prog['@_start'];
          const startDate = parseXmlTvTime(startTime);
          
          return {
            title,
            description: desc,
            category,
            start: startTime,
            startFormatted: startDate.toLocaleString('de-DE', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
            startTime: startDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
          };
        });
      
      return {
        id: channelId,
        name: channelName,
        icon: channel.icon?.['@_src'] || null,
        programmes: channelProgrammes,
      };
    }).filter((ch: any) => ch.programmes.length > 0);
    
    return NextResponse.json(
      {
        success: true,
        country: countryCode,
        totalChannels: channels.length,
        totalProgrammes: programmes.length,
        previewChannels: previewData.length,
        channels: previewData,
        generatedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] Fehler beim Abrufen der EPG-Preview:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Fehler beim Laden der EPG-Preview',
        message: error instanceof Error ? error.message : 'Unbekannter Fehler',
      },
      { status: 500 }
    );
  }
}

/**
 * Parst XMLTV Zeitformat (YYYYMMDDHHmmss +0000) zu Date
 */
function parseXmlTvTime(timeStr: string): Date {
  // Format: YYYYMMDDHHmmss +0000 oder YYYYMMDDHHmmss
  const match = timeStr.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\s+[+-]\d{4})?$/);
  
  if (match) {
    const [, year, month, day, hour, minute, second] = match;
    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(minute),
      parseInt(second) || 0
    );
  }
  
  return new Date();
}

export const dynamic = 'force-dynamic';
