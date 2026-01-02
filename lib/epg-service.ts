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

// Länder-Konfiguration mit EPG-Quellen
interface CountryConfig {
  code: string;
  name: string;
  sources: Array<{ url: string; compressed: boolean }>;
  fallbackSources: Array<{ url: string; compressed: boolean }>;
}

const COUNTRY_CONFIGS: Record<string, CountryConfig> = {
  DE: {
    code: 'DE',
    name: 'Deutschland',
    sources: [
      {
        url: 'https://raw.githubusercontent.com/globetvapp/epg/refs/heads/main/Germany/germany1.xml',
        compressed: false,
      },
      {
        url: 'https://epghub.xyz/epg/de.xml',
        compressed: false,
      },
      {
        url: 'https://epgshare01.online/epgshare01/epg_ripper_DE1.xml.gz',
        compressed: true,
      },
    ],
    fallbackSources: [
      {
        url: 'https://epgshare01.online/epgshare01/epg_ripper_DE1.xml.gz',
        compressed: true,
      },
      {
        url: 'https://epghub.xyz/epg/de.xml',
        compressed: false,
      },
      {
        url: 'https://epgshare01.online/epgshare01/epg_ripper_DE1.xml',
        compressed: false,
      },
    ],
  },
  US: {
    code: 'US',
    name: 'United States',
    sources: [
      {
        url: 'https://raw.githubusercontent.com/globetvapp/epg/refs/heads/main/USA/usa1.xml',
        compressed: false,
      },
      {
        url: 'https://epghub.xyz/epg/us.xml',
        compressed: false,
      },
    ],
    fallbackSources: [
      {
        url: 'https://epghub.xyz/epg/us.xml',
        compressed: false,
      },
    ],
  },
  GB: {
    code: 'GB',
    name: 'United Kingdom',
    sources: [
      {
        url: 'https://raw.githubusercontent.com/globetvapp/epg/refs/heads/main/UK/uk1.xml',
        compressed: false,
      },
      {
        url: 'https://epghub.xyz/epg/gb.xml',
        compressed: false,
      },
    ],
    fallbackSources: [
      {
        url: 'https://epghub.xyz/epg/gb.xml',
        compressed: false,
      },
    ],
  },
  FR: {
    code: 'FR',
    name: 'France',
    sources: [
      {
        url: 'https://raw.githubusercontent.com/globetvapp/epg/refs/heads/main/France/france1.xml',
        compressed: false,
      },
      {
        url: 'https://epghub.xyz/epg/fr.xml',
        compressed: false,
      },
    ],
    fallbackSources: [
      {
        url: 'https://epghub.xyz/epg/fr.xml',
        compressed: false,
      },
    ],
  },
  IT: {
    code: 'IT',
    name: 'Italy',
    sources: [
      {
        url: 'https://raw.githubusercontent.com/globetvapp/epg/refs/heads/main/Italy/italy1.xml',
        compressed: false,
      },
      {
        url: 'https://epghub.xyz/epg/it.xml',
        compressed: false,
      },
    ],
    fallbackSources: [
      {
        url: 'https://epghub.xyz/epg/it.xml',
        compressed: false,
      },
    ],
  },
  ES: {
    code: 'ES',
    name: 'Spain',
    sources: [
      {
        url: 'https://raw.githubusercontent.com/globetvapp/epg/refs/heads/main/Spain/spain1.xml',
        compressed: false,
      },
      {
        url: 'https://epghub.xyz/epg/es.xml',
        compressed: false,
      },
    ],
    fallbackSources: [
      {
        url: 'https://epghub.xyz/epg/es.xml',
        compressed: false,
      },
    ],
  },
  NL: {
    code: 'NL',
    name: 'Netherlands',
    sources: [
      {
        url: 'https://raw.githubusercontent.com/globetvapp/epg/refs/heads/main/Netherlands/netherlands1.xml',
        compressed: false,
      },
      {
        url: 'https://epghub.xyz/epg/nl.xml',
        compressed: false,
      },
    ],
    fallbackSources: [
      {
        url: 'https://epghub.xyz/epg/nl.xml',
        compressed: false,
      },
    ],
  },
  PL: {
    code: 'PL',
    name: 'Poland',
    sources: [
      {
        url: 'https://raw.githubusercontent.com/globetvapp/epg/refs/heads/main/Poland/poland1.xml',
        compressed: false,
      },
      {
        url: 'https://epghub.xyz/epg/pl.xml',
        compressed: false,
      },
    ],
    fallbackSources: [
      {
        url: 'https://epghub.xyz/epg/pl.xml',
        compressed: false,
      },
    ],
  },
  AT: {
    code: 'AT',
    name: 'Austria',
    sources: [
      {
        url: 'https://raw.githubusercontent.com/globetvapp/epg/refs/heads/main/Austria/austria1.xml',
        compressed: false,
      },
      {
        url: 'https://epghub.xyz/epg/at.xml',
        compressed: false,
      },
    ],
    fallbackSources: [
      {
        url: 'https://epghub.xyz/epg/at.xml',
        compressed: false,
      },
    ],
  },
  CH: {
    code: 'CH',
    name: 'Switzerland',
    sources: [
      {
        url: 'https://raw.githubusercontent.com/globetvapp/epg/refs/heads/main/Switzerland/switzerland1.xml',
        compressed: false,
      },
      {
        url: 'https://epghub.xyz/epg/ch.xml',
        compressed: false,
      },
    ],
    fallbackSources: [
      {
        url: 'https://epghub.xyz/epg/ch.xml',
        compressed: false,
      },
    ],
  },
  BE: {
    code: 'BE',
    name: 'Belgium',
    sources: [
      {
        url: 'https://raw.githubusercontent.com/globetvapp/epg/refs/heads/main/Belgium/belgium1.xml',
        compressed: false,
      },
      {
        url: 'https://epghub.xyz/epg/be.xml',
        compressed: false,
      },
    ],
    fallbackSources: [
      {
        url: 'https://epghub.xyz/epg/be.xml',
        compressed: false,
      },
    ],
  },
  CA: {
    code: 'CA',
    name: 'Canada',
    sources: [
      {
        url: 'https://raw.githubusercontent.com/globetvapp/epg/refs/heads/main/Canada/canada1.xml',
        compressed: false,
      },
      {
        url: 'https://epghub.xyz/epg/ca.xml',
        compressed: false,
      },
    ],
    fallbackSources: [
      {
        url: 'https://epghub.xyz/epg/ca.xml',
        compressed: false,
      },
    ],
  },
  AU: {
    code: 'AU',
    name: 'Australia',
    sources: [
      {
        url: 'https://raw.githubusercontent.com/globetvapp/epg/refs/heads/main/Australia/australia1.xml',
        compressed: false,
      },
      {
        url: 'https://epghub.xyz/epg/au.xml',
        compressed: false,
      },
    ],
    fallbackSources: [
      {
        url: 'https://epghub.xyz/epg/au.xml',
        compressed: false,
      },
    ],
  },
  // Weitere Länder mit epghub.xyz
  PT: {
    code: 'PT',
    name: 'Portugal',
    sources: [
      {
        url: 'https://epghub.xyz/epg/pt.xml',
        compressed: false,
      },
    ],
    fallbackSources: [],
  },
  GR: {
    code: 'GR',
    name: 'Greece',
    sources: [
      {
        url: 'https://epghub.xyz/epg/gr.xml',
        compressed: false,
      },
    ],
    fallbackSources: [],
  },
  TR: {
    code: 'TR',
    name: 'Turkey',
    sources: [
      {
        url: 'https://epghub.xyz/epg/tr.xml',
        compressed: false,
      },
    ],
    fallbackSources: [],
  },
  RO: {
    code: 'RO',
    name: 'Romania',
    sources: [
      {
        url: 'https://epghub.xyz/epg/ro.xml',
        compressed: false,
      },
    ],
    fallbackSources: [],
  },
  CZ: {
    code: 'CZ',
    name: 'Czech Republic',
    sources: [
      {
        url: 'https://epghub.xyz/epg/cz.xml',
        compressed: false,
      },
    ],
    fallbackSources: [],
  },
  SE: {
    code: 'SE',
    name: 'Sweden',
    sources: [
      {
        url: 'https://epghub.xyz/epg/se.xml',
        compressed: false,
      },
    ],
    fallbackSources: [],
  },
  NO: {
    code: 'NO',
    name: 'Norway',
    sources: [
      {
        url: 'https://epghub.xyz/epg/no.xml',
        compressed: false,
      },
    ],
    fallbackSources: [],
  },
  DK: {
    code: 'DK',
    name: 'Denmark',
    sources: [
      {
        url: 'https://epghub.xyz/epg/dk.xml',
        compressed: false,
      },
    ],
    fallbackSources: [],
  },
  FI: {
    code: 'FI',
    name: 'Finland',
    sources: [
      {
        url: 'https://epghub.xyz/epg/fi.xml',
        compressed: false,
      },
    ],
    fallbackSources: [],
  },
  IE: {
    code: 'IE',
    name: 'Ireland',
    sources: [
      {
        url: 'https://epghub.xyz/epg/ie.xml',
        compressed: false,
      },
    ],
    fallbackSources: [],
  },
  BR: {
    code: 'BR',
    name: 'Brazil',
    sources: [
      {
        url: 'https://epghub.xyz/epg/br.xml',
        compressed: false,
      },
    ],
    fallbackSources: [],
  },
  MX: {
    code: 'MX',
    name: 'Mexico',
    sources: [
      {
        url: 'https://epghub.xyz/epg/mx.xml',
        compressed: false,
      },
    ],
    fallbackSources: [],
  },
  AR: {
    code: 'AR',
    name: 'Argentina',
    sources: [
      {
        url: 'https://epghub.xyz/epg/ar.xml',
        compressed: false,
      },
    ],
    fallbackSources: [],
  },
  CL: {
    code: 'CL',
    name: 'Chile',
    sources: [
      {
        url: 'https://epghub.xyz/epg/cl.xml',
        compressed: false,
      },
    ],
    fallbackSources: [],
  },
  CO: {
    code: 'CO',
    name: 'Colombia',
    sources: [
      {
        url: 'https://epghub.xyz/epg/co.xml',
        compressed: false,
      },
    ],
    fallbackSources: [],
  },
  IN: {
    code: 'IN',
    name: 'India',
    sources: [
      {
        url: 'https://epghub.xyz/epg/in.xml',
        compressed: false,
      },
    ],
    fallbackSources: [],
  },
  JP: {
    code: 'JP',
    name: 'Japan',
    sources: [
      {
        url: 'https://epghub.xyz/epg/jp.xml',
        compressed: false,
      },
    ],
    fallbackSources: [],
  },
  KR: {
    code: 'KR',
    name: 'South Korea',
    sources: [
      {
        url: 'https://epghub.xyz/epg/kr.xml',
        compressed: false,
      },
    ],
    fallbackSources: [],
  },
  CN: {
    code: 'CN',
    name: 'China',
    sources: [
      {
        url: 'https://epghub.xyz/epg/cn.xml',
        compressed: false,
      },
    ],
    fallbackSources: [],
  },
  RU: {
    code: 'RU',
    name: 'Russia',
    sources: [
      {
        url: 'https://epghub.xyz/epg/ru.xml',
        compressed: false,
      },
    ],
    fallbackSources: [],
  },
  UA: {
    code: 'UA',
    name: 'Ukraine',
    sources: [
      {
        url: 'https://epghub.xyz/epg/ua.xml',
        compressed: false,
      },
    ],
    fallbackSources: [],
  },
  SA: {
    code: 'SA',
    name: 'Saudi Arabia',
    sources: [
      {
        url: 'https://epghub.xyz/epg/sa.xml',
        compressed: false,
      },
    ],
    fallbackSources: [],
  },
  AE: {
    code: 'AE',
    name: 'United Arab Emirates',
    sources: [
      {
        url: 'https://epghub.xyz/epg/ae.xml',
        compressed: false,
      },
    ],
    fallbackSources: [],
  },
  ZA: {
    code: 'ZA',
    name: 'South Africa',
    sources: [
      {
        url: 'https://epghub.xyz/epg/za.xml',
        compressed: false,
      },
    ],
    fallbackSources: [],
  },
  NZ: {
    code: 'NZ',
    name: 'New Zealand',
    sources: [
      {
        url: 'https://epghub.xyz/epg/nz.xml',
        compressed: false,
      },
    ],
    fallbackSources: [],
  },
};

// Standard-Land (Deutschland)
const DEFAULT_COUNTRY = 'DE';

/**
 * Gibt alle verfügbaren Länder zurück
 */
export function getAvailableCountries(): Array<{ code: string; name: string }> {
  return Object.values(COUNTRY_CONFIGS).map((config) => ({
    code: config.code,
    name: config.name,
  }));
}

/**
 * Gibt die Konfiguration für ein Land zurück
 */
export function getCountryConfig(countryCode: string): CountryConfig {
  const code = countryCode.toUpperCase();
  return COUNTRY_CONFIGS[code] || COUNTRY_CONFIGS[DEFAULT_COUNTRY];
}

// In-Memory Cache für die EPG Daten (pro Land)
const epgCache: Map<string, EpgCache> = new Map();

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
 * Gibt null zurück bei Fehler (für Fallback-Mechanismus)
 */
async function loadSingleSource(url: string, compressed: boolean): Promise<string | null> {
  console.log(`[EPG] Lade Quelle: ${url} (compressed: ${compressed})`);

  try {
    const response = await fetch(url, {
      // Kein Next.js Cache auf Vercel, um immer frische Daten zu bekommen
      cache: 'no-store',
      // Timeout nach 30 Sekunden
      signal: AbortSignal.timeout(30000),
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
    return null; // Return null statt throw für Fallback-Mechanismus
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
 * Lädt alle EPG Quellen für ein bestimmtes Land und merged sie
 * Verwendet Fallback-Quellen, wenn primäre Quellen fehlschlagen
 */
export async function loadEpgData(countryCode: string = DEFAULT_COUNTRY): Promise<string> {
  const config = getCountryConfig(countryCode);
  const startTime = Date.now();
  console.log(`[EPG] Lade EPG Daten für ${config.name} (${config.code})...`);
  console.log(`[EPG] ${config.sources.length} primäre Quellen verfügbar`);

  // Versuche primäre Quellen zu laden
  const loadPromises = config.sources.map((source) =>
    loadSingleSource(source.url, source.compressed)
  );

  const primaryResults = await Promise.all(loadPromises);
  
  // Filtere erfolgreiche Ergebnisse heraus
  const successfulData = primaryResults.filter((data): data is string => data !== null);
  
  // Wenn mindestens eine primäre Quelle erfolgreich war, merge die Daten
  if (successfulData.length > 0) {
    console.log(`[EPG] ${successfulData.length}/${config.sources.length} primäre Quellen erfolgreich geladen`);
    
    try {
      const mergedXml = mergeEpgData(successfulData);
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(
        `[EPG] Erfolgreich geladen in ${duration}s (${Math.round(mergedXml.length / 1024)} KB)`
      );
      return mergedXml;
    } catch (error) {
      console.error('[EPG] Fehler beim Mergen der primären Daten:', error);
      // Fallback wird verwendet
    }
  }

  // Alle primären Quellen fehlgeschlagen - verwende Fallback
  if (config.fallbackSources.length === 0) {
    throw new Error(`Keine EPG Daten für ${config.name} verfügbar`);
  }

  console.log('[EPG] Alle primären Quellen fehlgeschlagen, verwende Fallback-Quellen...');
  
  const fallbackPromises = config.fallbackSources.map((source) =>
    loadSingleSource(source.url, source.compressed)
  );

  const fallbackResults = await Promise.all(fallbackPromises);
  const fallbackData = fallbackResults.filter((data): data is string => data !== null);

  if (fallbackData.length === 0) {
    throw new Error(`Alle EPG Quellen (primär und Fallback) für ${config.name} sind fehlgeschlagen`);
  }

  console.log(`[EPG] ${fallbackData.length}/${config.fallbackSources.length} Fallback-Quellen erfolgreich geladen`);
  
  const mergedXml = mergeEpgData(fallbackData);
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(
    `[EPG] Fallback erfolgreich geladen in ${duration}s (${Math.round(mergedXml.length / 1024)} KB)`
  );

  return mergedXml;
}

/**
 * Gibt die gecachten EPG Daten zurück oder lädt sie neu,
 * wenn der Cache abgelaufen ist.
 */
export async function getEpgData(countryCode: string = DEFAULT_COUNTRY): Promise<string> {
  const revalidateSeconds = parseInt(
    process.env.EPG_REVALIDATE_SECONDS || '86400',
    10
  );

  const now = Date.now();
  const cacheKey = countryCode.toUpperCase();
  const cached = epgCache.get(cacheKey);

  // Prüfe ob Cache vorhanden und noch gültig ist
  if (cached && now - cached.timestamp < revalidateSeconds * 1000) {
    console.log(`[EPG] Cache-Hit für ${cacheKey}`);
    return cached.data;
  }

  // Cache ist abgelaufen oder nicht vorhanden - neu laden
  console.log(`[EPG] Cache-Miss für ${cacheKey} - lade Daten neu`);
  const data = await loadEpgData(countryCode);

  // Cache aktualisieren
  epgCache.set(cacheKey, {
    data,
    timestamp: now,
  });

  return data;
}

/**
 * Setzt den Cache zurück (nützlich für manuelle Updates)
 */
export function resetEpgCache(countryCode?: string): void {
  if (countryCode) {
    epgCache.delete(countryCode.toUpperCase());
    console.log(`[EPG] Cache für ${countryCode} zurückgesetzt`);
  } else {
    epgCache.clear();
    console.log('[EPG] Alle Caches zurückgesetzt');
  }
}

/**
 * Gibt Informationen über den Cache-Status zurück
 */
export function getCacheInfo(countryCode: string = DEFAULT_COUNTRY): {
  cached: boolean;
  age: number | null;
  ageFormatted: string | null;
} {
  const cacheKey = countryCode.toUpperCase();
  const cached = epgCache.get(cacheKey);

  if (!cached) {
    return {
      cached: false,
      age: null,
      ageFormatted: null,
    };
  }

  const age = Date.now() - cached.timestamp;
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
