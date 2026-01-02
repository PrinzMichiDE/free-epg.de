/**
 * Statistics Service für Besucher- und Download-Counter
 * Mit täglicher Nutzung und Player-Erkennung
 * Verwendet Vercel Edge Config für persistente Speicherung
 */

// Vercel Edge Config Import (optional, falls nicht konfiguriert)
let edgeConfigGet: ((key: string) => Promise<any>) | null = null;
let edgeConfigToken: string | null = null;
let edgeConfigStoreId: string | null = null;
let edgeConfigInitialized = false;

// Initialisiere Edge Config nur wenn Umgebungsvariablen gesetzt sind
function initializeEdgeConfig(): void {
  if (edgeConfigInitialized) return;
  edgeConfigInitialized = true;
  
  const connectionString = process.env.EDGE_CONFIG;
  edgeConfigToken = process.env.EDGE_CONFIG_TOKEN || null;
  
  // Nur initialisieren wenn Connection String vorhanden ist
  if (!connectionString) {
    return; // Keine Warnung, da Edge Config optional ist
  }
  
  try {
    // Extrahiere Store-ID aus Connection String (Format: https://edge-config.vercel.com/{storeId}?token=...)
    const urlMatch = connectionString.match(/edge-config\.vercel\.com\/([^?]+)/);
    if (urlMatch) {
      edgeConfigStoreId = urlMatch[1];
    }
    
    // Importiere Edge Config get Funktion
    // Die @vercel/edge-config Bibliothek exportiert get direkt
    const edgeConfigModule = require('@vercel/edge-config');
    
    // Prüfe verschiedene mögliche Export-Formate
    let getFunction = edgeConfigModule.get || edgeConfigModule.default?.get || edgeConfigModule;
    
    if (typeof getFunction === 'function') {
      // Erstelle eine get Funktion die den Connection String verwendet
      // Edge Config verwendet automatisch EDGE_CONFIG env variable wenn vorhanden
      edgeConfigGet = async (key: string) => {
        try {
          // Versuche mit Connection String Option
          if (typeof getFunction === 'function' && getFunction.length > 1) {
            return await getFunction(key, { edgeConfig: connectionString });
          }
          // Fallback: direkter Aufruf (nutzt automatisch EDGE_CONFIG env)
          return await getFunction(key);
        } catch (err) {
          console.error(`[Stats] Fehler beim Lesen von Edge Config Key ${key}:`, err);
          return null;
        }
      };
    } else {
      throw new Error('Edge Config get function not available');
    }
  } catch (error) {
    // Nur warnen wenn Connection String vorhanden aber Initialisierung fehlschlägt
    console.warn('[Stats] Vercel Edge Config Initialisierung fehlgeschlagen:', error);
    edgeConfigGet = null;
    edgeConfigStoreId = null;
  }
}

interface Stats {
  visitors: number;
  downloads: number;
  lastReset: number;
}

interface DailyUsage {
  date: string; // YYYY-MM-DD
  downloads: number;
  uniqueIPs: string[]; // Array statt Set für Edge Config-Kompatibilität
}

interface PlayerStats {
  [playerName: string]: number;
}

// Startwerte für Counter
const INITIAL_VISITORS = 224232;
const INITIAL_DOWNLOADS = 12231082;

// Cache für aktuelle Stats (wird regelmäßig mit Edge Config synchronisiert)
let statsCache: Stats | null = null;
let dailyUsageCache: Map<string, DailyUsage> | null = null;
let playerStatsCache: PlayerStats | null = null;

// Edge Config Keys
const EDGE_STATS_KEY = 'epg_stats';
const EDGE_DAILY_USAGE_KEY = 'epg_dailyUsage';
const EDGE_PLAYER_STATS_KEY = 'epg_playerStats';

/**
 * Prüft ob Edge Config verfügbar ist
 */
function isEdgeConfigAvailable(): boolean {
  // Initialisiere beim ersten Aufruf
  if (!edgeConfigInitialized) {
    initializeEdgeConfig();
  }
  
  try {
    const hasConnectionString = !!process.env.EDGE_CONFIG;
    const hasGetFunction = edgeConfigGet !== null && typeof edgeConfigGet === 'function';
    
    // Für Reads reicht die Connection String und get Funktion
    return hasConnectionString && hasGetFunction;
  } catch {
    return false;
  }
}

/**
 * Prüft ob Edge Config für Writes verfügbar ist
 */
function isEdgeConfigWriteAvailable(): boolean {
  if (!edgeConfigInitialized) {
    initializeEdgeConfig();
  }
  
  try {
    return isEdgeConfigAvailable() && 
           edgeConfigToken !== null && 
           edgeConfigToken !== undefined;
  } catch {
    return false;
  }
}

/**
 * Lädt Stats aus Edge Config oder gibt Standardwerte zurück
 */
async function loadStats(): Promise<Stats> {
  if (statsCache) return statsCache;
  
  if (isEdgeConfigAvailable() && edgeConfigGet) {
    try {
      const edgeStatsStr = await edgeConfigGet(EDGE_STATS_KEY) as string | null;
      if (edgeStatsStr) {
        const edgeStats = JSON.parse(edgeStatsStr) as Stats;
        statsCache = edgeStats;
        return edgeStats;
      }
    } catch (error) {
      console.error('[Stats] Fehler beim Laden aus Edge Config:', error);
    }
  }
  
  // Fallback: Standardwerte
  const defaultStats: Stats = {
    visitors: INITIAL_VISITORS,
    downloads: INITIAL_DOWNLOADS,
    lastReset: Date.now(),
  };
  statsCache = defaultStats;
  return defaultStats;
}

/**
 * Speichert Stats in Edge Config über REST API
 */
async function saveStats(stats: Stats): Promise<void> {
  statsCache = stats;
  
  if (isEdgeConfigWriteAvailable()) {
    try {
      if (!edgeConfigStoreId) {
        const edgeConfigUrl = process.env.EDGE_CONFIG;
        if (!edgeConfigUrl) return;
        
        // Extrahiere die Store-ID aus der Connection String
        const urlMatch = edgeConfigUrl.match(/edge-config\.vercel\.com\/([^?]+)/);
        if (!urlMatch) return;
        edgeConfigStoreId = urlMatch[1];
      }
      
      if (!edgeConfigStoreId) return;
      
      const response = await fetch(`https://api.vercel.com/v1/edge-config/${edgeConfigStoreId}/items`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${edgeConfigToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [
            {
              operation: 'update',
              key: EDGE_STATS_KEY,
              value: JSON.stringify(stats),
            },
          ],
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Edge Config API error: ${response.status}`);
      }
    } catch (error) {
      console.error('[Stats] Fehler beim Speichern in Edge Config:', error);
    }
  }
}

/**
 * Lädt tägliche Nutzung aus Edge Config
 */
async function loadDailyUsage(): Promise<Map<string, DailyUsage>> {
  if (dailyUsageCache) return dailyUsageCache;
  
  const usageMap = new Map<string, DailyUsage>();
  
  if (isEdgeConfigAvailable() && edgeConfigGet) {
    try {
      const edgeUsageStr = await edgeConfigGet(EDGE_DAILY_USAGE_KEY) as string | null;
      if (edgeUsageStr) {
        const edgeUsage = JSON.parse(edgeUsageStr) as Record<string, DailyUsage>;
        Object.entries(edgeUsage).forEach(([date, usage]) => {
          usageMap.set(date, usage);
        });
        dailyUsageCache = usageMap;
        return usageMap;
      }
    } catch (error) {
      console.error('[Stats] Fehler beim Laden der täglichen Nutzung aus Edge Config:', error);
    }
  }
  
  dailyUsageCache = usageMap;
  return usageMap;
}

/**
 * Speichert tägliche Nutzung in Edge Config über REST API
 */
async function saveDailyUsage(usage: Map<string, DailyUsage>): Promise<void> {
  dailyUsageCache = usage;
  
  if (isEdgeConfigWriteAvailable()) {
    try {
      if (!edgeConfigStoreId) {
        const edgeConfigUrl = process.env.EDGE_CONFIG;
        if (!edgeConfigUrl) return;
        
        const urlMatch = edgeConfigUrl.match(/edge-config\.vercel\.com\/([^?]+)/);
        if (!urlMatch) return;
        edgeConfigStoreId = urlMatch[1];
      }
      
      if (!edgeConfigStoreId) return;
      
      const usageObj: Record<string, DailyUsage> = {};
      usage.forEach((value, key) => {
        usageObj[key] = value;
      });
      
      const response = await fetch(`https://api.vercel.com/v1/edge-config/${edgeConfigStoreId}/items`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${edgeConfigToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [
            {
              operation: 'update',
              key: EDGE_DAILY_USAGE_KEY,
              value: JSON.stringify(usageObj),
            },
          ],
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Edge Config API error: ${response.status}`);
      }
    } catch (error) {
      console.error('[Stats] Fehler beim Speichern der täglichen Nutzung in Edge Config:', error);
    }
  }
}

/**
 * Lädt Player-Stats aus Edge Config
 */
async function loadPlayerStats(): Promise<PlayerStats> {
  if (playerStatsCache) return playerStatsCache;
  
  if (isEdgeConfigAvailable() && edgeConfigGet) {
    try {
      const edgeStatsStr = await edgeConfigGet(EDGE_PLAYER_STATS_KEY) as string | null;
      if (edgeStatsStr) {
        const edgeStats = JSON.parse(edgeStatsStr) as PlayerStats;
        playerStatsCache = edgeStats;
        return edgeStats;
      }
    } catch (error) {
      console.error('[Stats] Fehler beim Laden der Player-Stats aus Edge Config:', error);
    }
  }
  
  const defaultStats: PlayerStats = {};
  playerStatsCache = defaultStats;
  return defaultStats;
}

/**
 * Speichert Player-Stats in Edge Config über REST API
 */
async function savePlayerStats(stats: PlayerStats): Promise<void> {
  playerStatsCache = stats;
  
  if (isEdgeConfigWriteAvailable()) {
    try {
      if (!edgeConfigStoreId) {
        const edgeConfigUrl = process.env.EDGE_CONFIG;
        if (!edgeConfigUrl) return;
        
        const urlMatch = edgeConfigUrl.match(/edge-config\.vercel\.com\/([^?]+)/);
        if (!urlMatch) return;
        edgeConfigStoreId = urlMatch[1];
      }
      
      if (!edgeConfigStoreId) return;
      
      const response = await fetch(`https://api.vercel.com/v1/edge-config/${edgeConfigStoreId}/items`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${edgeConfigToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [
            {
              operation: 'update',
              key: EDGE_PLAYER_STATS_KEY,
              value: JSON.stringify(stats),
            },
          ],
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Edge Config API error: ${response.status}`);
      }
    } catch (error) {
      console.error('[Stats] Fehler beim Speichern der Player-Stats in Edge Config:', error);
    }
  }
}

/**
 * Erkennt den Player aus dem User-Agent String
 */
export function detectPlayer(userAgent: string | null): string {
  if (!userAgent) return 'Unknown';

  const ua = userAgent.toLowerCase();

  // Bekannte IPTV-Apps erkennen
  if (ua.includes('tivimate')) return 'TiviMate';
  if (ua.includes('iptv') && ua.includes('smarters')) return 'IPTV Smarters Pro';
  if (ua.includes('perfect') && ua.includes('player')) return 'Perfect Player';
  if (ua.includes('kodi')) return 'Kodi';
  if (ua.includes('vlc')) return 'VLC';
  if (ua.includes('mx player')) return 'MX Player';
  if (ua.includes('exo')) return 'ExoPlayer';
  if (ua.includes('ffmpeg')) return 'FFmpeg';
  if (ua.includes('mpv')) return 'MPV';
  if (ua.includes('iina')) return 'IINA';
  if (ua.includes('plex')) return 'Plex';
  if (ua.includes('jellyfin')) return 'Jellyfin';
  if (ua.includes('emby')) return 'Emby';
  if (ua.includes('smart') && ua.includes('iptv')) return 'Smart IPTV';
  if (ua.includes('ss') && ua.includes('iptv')) return 'SS IPTV';
  if (ua.includes('gse')) return 'GSE Smart IPTV';
  if (ua.includes('ott')) return 'OTT Navigator';
  if (ua.includes('xmtv')) return 'XM TV';
  if (ua.includes('iptv') && ua.includes('extreme')) return 'IPTV Extreme';
  
  // Browser erkennen
  if (ua.includes('chrome') && !ua.includes('edg')) return 'Chrome';
  if (ua.includes('firefox')) return 'Firefox';
  if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
  if (ua.includes('edg')) return 'Edge';
  if (ua.includes('opera')) return 'Opera';
  
  // Mobile Apps
  if (ua.includes('android')) return 'Android App';
  if (ua.includes('iphone') || ua.includes('ipad')) return 'iOS App';
  
  // Fallback
  if (ua.includes('curl')) return 'cURL';
  if (ua.includes('wget')) return 'Wget';
  if (ua.includes('python')) return 'Python';
  if (ua.includes('node')) return 'Node.js';
  
  return 'Other';
}

/**
 * Gibt das aktuelle Datum im Format YYYY-MM-DD zurück
 */
function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Inkrementiert den Besucherzähler
 */
export async function incrementVisitors(): Promise<void> {
  const stats = await loadStats();
  stats.visitors++;
  await saveStats(stats);
}

/**
 * Inkrementiert den Download-Zähler mit Player-Erkennung
 */
export async function incrementDownloads(userAgent?: string | null, ip?: string | null): Promise<void> {
  // Stats laden und inkrementieren
  const stats = await loadStats();
  stats.downloads++;
  await saveStats(stats);
  
  // Player erkennen und zählen
  const player = detectPlayer(userAgent || null);
  const playerStats = await loadPlayerStats();
  playerStats[player] = (playerStats[player] || 0) + 1;
  await savePlayerStats(playerStats);
  
  // Tägliche Nutzung tracken
  const todayKey = getTodayKey();
  const dailyUsage = await loadDailyUsage();
  const todayUsage = dailyUsage.get(todayKey) || {
    date: todayKey,
    downloads: 0,
    uniqueIPs: [],
  };
  
  todayUsage.downloads++;
  if (ip && !todayUsage.uniqueIPs.includes(ip)) {
    todayUsage.uniqueIPs.push(ip);
  }
  
  dailyUsage.set(todayKey, todayUsage);
  
  // Alte Einträge bereinigen (älter als 30 Tage)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  for (const [dateKey] of dailyUsage) {
    const date = new Date(dateKey);
    if (date < thirtyDaysAgo) {
      dailyUsage.delete(dateKey);
    }
  }
  
  await saveDailyUsage(dailyUsage);
}

/**
 * Gibt die aktuellen Statistiken zurück
 */
export async function getStats(): Promise<Stats> {
  return await loadStats();
}

/**
 * Gibt die tägliche Nutzung zurück (letzte 7 Tage)
 */
export async function getDailyUsage(): Promise<Array<{ date: string; downloads: number; uniqueIPs: number }>> {
  const dailyUsage = await loadDailyUsage();
  const result: Array<{ date: string; downloads: number; uniqueIPs: number }> = [];
  const today = new Date();
  
  // Letzte 7 Tage
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];
    
    const usage = dailyUsage.get(dateKey);
    
    if (usage && usage.downloads > 0) {
      result.push({
        date: dateKey,
        downloads: usage.downloads,
        uniqueIPs: usage.uniqueIPs.length,
      });
    } else {
      // Fallback: 0 wenn keine Daten vorhanden
      result.push({
        date: dateKey,
        downloads: 0,
        uniqueIPs: 0,
      });
    }
  }
  
  return result;
}

/**
 * Gibt die Player-Statistiken zurück
 */
export async function getPlayerStats(): Promise<PlayerStats> {
  const playerStats = await loadPlayerStats();
  
  // Wenn keine Daten vorhanden, gib leeres Objekt zurück
  if (Object.keys(playerStats).length === 0) {
    return {};
  }
  
  return { ...playerStats };
}

/**
 * Setzt die Statistiken zurück (behält aber die Basiswerte)
 */
export async function resetStats(): Promise<void> {
  const defaultStats: Stats = {
    visitors: INITIAL_VISITORS,
    downloads: INITIAL_DOWNLOADS,
    lastReset: Date.now(),
  };
  await saveStats(defaultStats);
  await saveDailyUsage(new Map());
  await savePlayerStats({});
  
  // Cache zurücksetzen
  statsCache = null;
  dailyUsageCache = null;
  playerStatsCache = null;
}

