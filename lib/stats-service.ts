/**
 * Statistics Service für Besucher- und Download-Counter
 * Mit täglicher Nutzung und Player-Erkennung
 */

interface Stats {
  visitors: number;
  downloads: number;
  lastReset: number;
}

interface DailyUsage {
  date: string; // YYYY-MM-DD
  downloads: number;
  uniqueIPs: Set<string>;
}

interface PlayerStats {
  [playerName: string]: number;
}

// Startwerte für Counter
const INITIAL_VISITORS = 224232;
const INITIAL_DOWNLOADS = 12231082;

// In-Memory Stats (auf Vercel wird dies pro Serverless Function Instance sein)
let stats: Stats = {
  visitors: INITIAL_VISITORS,
  downloads: INITIAL_DOWNLOADS,
  lastReset: Date.now(),
};

// Tägliche Nutzung (pro Datum)
const dailyUsage: Map<string, DailyUsage> = new Map();

// Player-Statistiken
const playerStats: PlayerStats = {};

/**
 * Initialisiert Fake-Daten für tägliche Nutzung (wenn keine echten Daten vorhanden)
 */
function initializeFakeDailyUsage(): void {
  if (dailyUsage.size > 0) return; // Nur wenn keine Daten vorhanden
  
  const today = new Date();
  const fakePlayers = ['TiviMate', 'IPTV Smarters Pro', 'Perfect Player', 'Kodi', 'VLC', 'Chrome', 'Firefox'];
  
  // Generiere Fake-Daten für die letzten 7 Tage
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];
    
    // Realistische tägliche Downloads (zwischen 5000 und 15000)
    const downloads = Math.floor(Math.random() * 10000) + 5000;
    const uniqueIPs = new Set<string>();
    
    // Generiere einige Fake-IPs
    for (let j = 0; j < Math.floor(downloads / 100); j++) {
      uniqueIPs.add(`192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`);
    }
    
    dailyUsage.set(dateKey, {
      date: dateKey,
      downloads,
      uniqueIPs,
    });
  }
  
  // Generiere Fake Player-Statistiken
  fakePlayers.forEach((player, idx) => {
    // Realistische Verteilung
    const baseCount = [45000, 32000, 28000, 15000, 12000, 8000, 5000][idx] || 3000;
    playerStats[player] = baseCount + Math.floor(Math.random() * 5000);
  });
}

// Initialisiere Fake-Daten beim Start
initializeFakeDailyUsage();

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
export function incrementVisitors(): void {
  stats.visitors++;
}

/**
 * Inkrementiert den Download-Zähler mit Player-Erkennung
 */
export function incrementDownloads(userAgent?: string | null, ip?: string | null): void {
  stats.downloads++;
  
  // Player erkennen und zählen
  const player = detectPlayer(userAgent || null);
  playerStats[player] = (playerStats[player] || 0) + 1;
  
  // Tägliche Nutzung tracken
  const todayKey = getTodayKey();
  const todayUsage = dailyUsage.get(todayKey) || {
    date: todayKey,
    downloads: 0,
    uniqueIPs: new Set<string>(),
  };
  
  todayUsage.downloads++;
  if (ip) {
    todayUsage.uniqueIPs.add(ip);
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
}

/**
 * Gibt die aktuellen Statistiken zurück
 */
export function getStats(): Stats {
  return { ...stats };
}

/**
 * Gibt die tägliche Nutzung zurück (letzte 7 Tage)
 */
export function getDailyUsage(): Array<{ date: string; downloads: number; uniqueIPs: number }> {
  // Initialisiere Fake-Daten falls keine vorhanden
  initializeFakeDailyUsage();
  
  const result: Array<{ date: string; downloads: number; uniqueIPs: number }> = [];
  const today = new Date();
  
  // Letzte 7 Tage
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];
    
    const usage = dailyUsage.get(dateKey);
    
    // Wenn keine echten Daten vorhanden, verwende Fake-Daten
    if (!usage || usage.downloads === 0) {
      const fakeDownloads = Math.floor(Math.random() * 10000) + 5000;
      const fakeIPs = Math.floor(fakeDownloads / 100);
      result.push({
        date: dateKey,
        downloads: fakeDownloads,
        uniqueIPs: fakeIPs,
      });
    } else {
      result.push({
        date: dateKey,
        downloads: usage.downloads,
        uniqueIPs: usage.uniqueIPs.size,
      });
    }
  }
  
  return result;
}

/**
 * Gibt die Player-Statistiken zurück
 */
export function getPlayerStats(): PlayerStats {
  // Initialisiere Fake-Daten falls keine vorhanden
  initializeFakeDailyUsage();
  
  // Wenn keine echten Player-Daten vorhanden, gib Fake-Daten zurück
  if (Object.keys(playerStats).length === 0) {
    const fakePlayers: PlayerStats = {
      'TiviMate': 45000,
      'IPTV Smarters Pro': 32000,
      'Perfect Player': 28000,
      'Kodi': 15000,
      'VLC': 12000,
      'Chrome': 8000,
      'Firefox': 5000,
      'ExoPlayer': 3500,
      'Other': 2500,
    };
    return fakePlayers;
  }
  
  return { ...playerStats };
}

/**
 * Setzt die Statistiken zurück (behält aber die Basiswerte)
 */
export function resetStats(): void {
  stats = {
    visitors: INITIAL_VISITORS,
    downloads: INITIAL_DOWNLOADS,
    lastReset: Date.now(),
  };
  dailyUsage.clear();
  Object.keys(playerStats).forEach(key => delete playerStats[key]);
}

