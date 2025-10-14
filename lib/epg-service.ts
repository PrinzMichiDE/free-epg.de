import pako from 'pako';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';

/**
 * EPG Service zum Laden, Mergen und Verarbeiten von mehreren EPG Quellen
 */

interface EpgCache {
  data: string;
  timestamp: number;
}

interface XmlTvChannel {
  '@_id': string;
  'display-name': string | string[];
  icon?: {
    '@_src': string;
  };
  [key: string]: any;
}

interface XmlTvProgramme {
  '@_start': string;
  '@_stop': string;
  '@_channel': string;
  title: string | { '#text': string; '@_lang'?: string };
  desc?: string | { '#text': string; '@_lang'?: string };
  category?: string | string[];
  [key: string]: any;
}

interface XmlTvRoot {
  tv: {
    '@_generator-info-name'?: string;
    '@_generator-info-url'?: string;
    channel?: XmlTvChannel | XmlTvChannel[];
    programme?: XmlTvProgramme | XmlTvProgramme[];
  };
}

// EPG Quellen Konfiguration
const EPG_SOURCES = [
  {
    url: 'https://raw.githubusercontent.com/globetvapp/epg/refs/heads/main/Germany/germany1.xml',
    compressed: false,
  },
  {
    url: 'https://epgshare01.online/epgshare01/epg_ripper_DE1.xml.gz',
    compressed: true,
  },
];

// In-Memory Cache für die EPG Daten
let epgCache: EpgCache | null = null;

// XML Parser Konfiguration
const parserOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseAttributeValue: false,
  trimValues: true,
};

const parser = new XMLParser(parserOptions);

const builderOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  format: true,
  suppressEmptyNode: true,
};

const builder = new XMLBuilder(builderOptions);

/**
 * Lädt eine einzelne EPG Quelle (mit oder ohne gz Komprimierung)
 */
async function loadSingleSource(url: string, compressed: boolean): Promise<string> {
  console.log(`[EPG] Lade Quelle: ${url} (compressed: ${compressed})`);

  try {
    const response = await fetch(url, {
      // Kein Next.js Cache auf Vercel, um immer frische Daten zu bekommen
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP Fehler: ${response.status} ${response.statusText}`);
    }

    if (compressed) {
      // .gz Daten laden und dekomprimieren
      const compressedData = await response.arrayBuffer();
      const decompressed = pako.inflate(new Uint8Array(compressedData), { to: 'string' });
      return decompressed;
    } else {
      // Normale XML Daten
      return await response.text();
    }
  } catch (error) {
    console.error(`[EPG] Fehler beim Laden von ${url}:`, error);
    throw error;
  }
}

/**
 * Normalisiert ein Array (stellt sicher, dass es ein Array ist)
 */
function normalizeArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

/**
 * Merged mehrere EPG XML Dateien zu einer einzigen
 */
function mergeEpgData(xmlDataArray: string[]): string {
  console.log(`[EPG] Merge ${xmlDataArray.length} Quellen...`);

  const parsedData: XmlTvRoot[] = [];

  // Alle XML Daten parsen
  for (const xmlData of xmlDataArray) {
    try {
      const parsed = parser.parse(xmlData) as XmlTvRoot;
      if (parsed && parsed.tv) {
        parsedData.push(parsed);
      }
    } catch (error) {
      console.error('[EPG] Fehler beim Parsen einer Quelle:', error);
    }
  }

  if (parsedData.length === 0) {
    throw new Error('Keine gültigen EPG Daten gefunden');
  }

  // Sammle alle Channels und Programme
  const channelsMap = new Map<string, XmlTvChannel>();
  const programmesArray: XmlTvProgramme[] = [];

  for (const data of parsedData) {
    // Channels sammeln (mit Deduplizierung)
    const channels = normalizeArray(data.tv.channel);
    for (const channel of channels) {
      if (channel['@_id']) {
        channelsMap.set(channel['@_id'], channel);
      }
    }

    // Programme sammeln
    const programmes = normalizeArray(data.tv.programme);
    programmesArray.push(...programmes);
  }

  // Sortiere Programme nach Start-Zeit
  programmesArray.sort((a, b) => {
    const startA = a['@_start'] || '';
    const startB = b['@_start'] || '';
    return startA.localeCompare(startB);
  });

  // Erstelle gemergtes XML Objekt
  const mergedData: XmlTvRoot = {
    tv: {
      '@_generator-info-name': 'EPG Service',
      '@_generator-info-url': 'https://github.com',
      channel: Array.from(channelsMap.values()),
      programme: programmesArray,
    },
  };

  // Zurück zu XML konvertieren
  const xmlOutput = '<?xml version="1.0" encoding="UTF-8"?>\n' + builder.build(mergedData);

  console.log(
    `[EPG] Merge abgeschlossen: ${channelsMap.size} Channels, ${programmesArray.length} Programme`
  );

  return xmlOutput;
}

/**
 * Lädt alle EPG Quellen und merged sie
 */
export async function loadEpgData(): Promise<string> {
  const startTime = Date.now();
  console.log(`[EPG] Lade ${EPG_SOURCES.length} EPG Quellen...`);

  try {
    // Alle Quellen parallel laden
    const loadPromises = EPG_SOURCES.map((source) =>
      loadSingleSource(source.url, source.compressed)
    );

    const xmlDataArray = await Promise.all(loadPromises);

    // Daten mergen
    const mergedXml = mergeEpgData(xmlDataArray);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(
      `[EPG] Erfolgreich geladen in ${duration}s (${Math.round(mergedXml.length / 1024)} KB)`
    );

    return mergedXml;
  } catch (error) {
    console.error('[EPG] Fehler beim Laden der EPG Daten:', error);
    throw error;
  }
}

/**
 * Gibt die gecachten EPG Daten zurück oder lädt sie neu,
 * wenn der Cache abgelaufen ist.
 */
export async function getEpgData(): Promise<string> {
  const revalidateSeconds = parseInt(
    process.env.EPG_REVALIDATE_SECONDS || '86400',
    10
  );

  const now = Date.now();

  // Prüfe ob Cache vorhanden und noch gültig ist
  if (epgCache && now - epgCache.timestamp < revalidateSeconds * 1000) {
    console.log('[EPG] Cache-Hit');
    return epgCache.data;
  }

  // Cache ist abgelaufen oder nicht vorhanden - neu laden
  console.log('[EPG] Cache-Miss - lade Daten neu');
  const data = await loadEpgData();

  // Cache aktualisieren
  epgCache = {
    data,
    timestamp: now,
  };

  return data;
}

/**
 * Setzt den Cache zurück (nützlich für manuelle Updates)
 */
export function resetEpgCache(): void {
  epgCache = null;
  console.log('[EPG] Cache zurückgesetzt');
}

/**
 * Gibt Informationen über den Cache-Status zurück
 */
export function getCacheInfo(): {
  cached: boolean;
  age: number | null;
  ageFormatted: string | null;
} {
  if (!epgCache) {
    return {
      cached: false,
      age: null,
      ageFormatted: null,
    };
  }

  const age = Date.now() - epgCache.timestamp;
  const ageMinutes = Math.floor(age / 1000 / 60);
  const ageHours = Math.floor(ageMinutes / 60);

  let ageFormatted: string;
  if (ageHours > 0) {
    ageFormatted = `${ageHours} Stunde${ageHours !== 1 ? 'n' : ''}`;
  } else {
    ageFormatted = `${ageMinutes} Minute${ageMinutes !== 1 ? 'n' : ''}`;
  }

  return {
    cached: true,
    age,
    ageFormatted,
  };
}
