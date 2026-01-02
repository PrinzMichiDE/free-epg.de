/**
 * Statistics Service für Besucher- und Download-Counter
 * Mit täglicher Nutzung und Player-Erkennung
 * Verwendet Vercel KV für persistente Speicherung
 */

// Vercel KV Import (optional, falls nicht konfiguriert)
type KvClient = {
  get: <T>(key: string) => Promise<T | null>;
  set: (key: string, value: any) => Promise<void>;
};

let kv: KvClient | null = null;
try {
  const kvModule = require('@vercel/kv');
  kv = kvModule.kv as KvClient;
} catch {
  // KV nicht verfügbar, verwende In-Memory-Fallback
  console.warn('[Stats] Vercel KV nicht verfügbar, verwende In-Memory-Speicher');
}

interface Stats {
  visitors: number;
  downloads: number;
  lastReset: number;
}

interface DailyUsage {
  date: string; // YYYY-MM-DD
  downloads: number;
  uniqueIPs: string[]; // Array statt Set für KV-Kompatibilität
}

interface PlayerStats {
  [playerName: string]: number;
}

// Startwerte für Counter
const INITIAL_VISITORS = 224232;
const INITIAL_DOWNLOADS = 12231082;

// Cache für aktuelle Stats (wird regelmäßig mit KV synchronisiert)
let statsCache: Stats | null = null;
let dailyUsageCache: Map<string, DailyUsage> | null = null;
let playerStatsCache: PlayerStats | null = null;

// KV Keys
const KV_STATS_KEY = 'epg:stats';
const KV_DAILY_USAGE_KEY = 'epg:dailyUsage';
const KV_PLAYER_STATS_KEY = 'epg:playerStats';

/**
 * Prüft ob KV verfügbar ist
 */
function isKvAvailable(): boolean {
  try {
    return kv !== null && typeof kv !== 'undefined';
  } catch {
    return false;
  }
}

/**
 * Lädt Stats aus KV oder gibt Standardwerte zurück
 */
async function loadStats(): Promise<Stats> {
  if (statsCache) return statsCache;
  
  if (isKvAvailable() && kv) {
    try {
      const kvStats = await kv.get(KV_STATS_KEY) as Stats | null;
      if (kvStats) {
        statsCache = kvStats;
        return kvStats;
      }
    } catch (error) {
      console.error('[Stats] Fehler beim Laden aus KV:', error);
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
 * Speichert Stats in KV
 */
async function saveStats(stats: Stats): Promise<void> {
  statsCache = stats;
  
  if (isKvAvailable() && kv) {
    try {
      await kv.set(KV_STATS_KEY, stats);
    } catch (error) {
      console.error('[Stats] Fehler beim Speichern in KV:', error);
    }
  }
}

/**
 * Lädt tägliche Nutzung aus KV
 */
async function loadDailyUsage(): Promise<Map<string, DailyUsage>> {
  if (dailyUsageCache) return dailyUsageCache;
  
  const usageMap = new Map<string, DailyUsage>();
  
  if (isKvAvailable() && kv) {
    try {
      const kvUsage = await kv.get(KV_DAILY_USAGE_KEY) as Record<string, DailyUsage> | null;
      if (kvUsage) {
        Object.entries(kvUsage).forEach(([date, usage]) => {
          usageMap.set(date, usage);
        });
        dailyUsageCache = usageMap;
        return usageMap;
      }
    } catch (error) {
      console.error('[Stats] Fehler beim Laden der täglichen Nutzung aus KV:', error);
    }
  }
  
  dailyUsageCache = usageMap;
  return usageMap;
}

/**
 * Speichert tägliche Nutzung in KV
 */
async function saveDailyUsage(usage: Map<string, DailyUsage>): Promise<void> {
  dailyUsageCache = usage;
  
  if (isKvAvailable() && kv) {
    try {
      const usageObj: Record<string, DailyUsage> = {};
      usage.forEach((value, key) => {
        usageObj[key] = value;
      });
      await kv.set(KV_DAILY_USAGE_KEY, usageObj);
    } catch (error) {
      console.error('[Stats] Fehler beim Speichern der täglichen Nutzung in KV:', error);
    }
  }
}

/**
 * Lädt Player-Stats aus KV
 */
async function loadPlayerStats(): Promise<PlayerStats> {
  if (playerStatsCache) return playerStatsCache;
  
  if (isKvAvailable() && kv) {
    try {
      const kvStats = await kv.get(KV_PLAYER_STATS_KEY) as PlayerStats | null;
      if (kvStats) {
        playerStatsCache = kvStats;
        return kvStats;
      }
    } catch (error) {
      console.error('[Stats] Fehler beim Laden der Player-Stats aus KV:', error);
    }
  }
  
  const defaultStats: PlayerStats = {};
  playerStatsCache = defaultStats;
  return defaultStats;
}

/**
 * Speichert Player-Stats in KV
 */
async function savePlayerStats(stats: PlayerStats): Promise<void> {
  playerStatsCache = stats;
  
  if (isKvAvailable() && kv) {
    try {
      await kv.set(KV_PLAYER_STATS_KEY, stats);
    } catch (error) {
      console.error('[Stats] Fehler beim Speichern der Player-Stats in KV:', error);
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

