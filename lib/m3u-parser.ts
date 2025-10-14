/**
 * M3U Playlist Parser
 */

export interface Channel {
  id: string;
  name: string;
  url: string;
  logo?: string;
  group?: string;
}

/**
 * Parst eine M3U Playlist und extrahiert Channel-Informationen
 */
export function parseM3U(content: string): Channel[] {
  const lines = content.split('\n');
  const channels: Channel[] = [];
  let currentChannel: Partial<Channel> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // EXTINF Zeile enthält Channel-Infos
    if (line.startsWith('#EXTINF:')) {
      currentChannel = {};

      // Extrahiere Logo
      const logoMatch = line.match(/tvg-logo="([^"]*)"/);
      if (logoMatch) {
        currentChannel.logo = logoMatch[1];
      }

      // Extrahiere Group
      const groupMatch = line.match(/group-title="([^"]*)"/);
      if (groupMatch) {
        currentChannel.group = groupMatch[1];
      }

      // Extrahiere Channel-Name (nach dem letzten Komma)
      const nameMatch = line.match(/,(.+)$/);
      if (nameMatch) {
        currentChannel.name = nameMatch[1].trim();
      }
    }
    // URL Zeile (nicht mit # beginnend)
    else if (line && !line.startsWith('#') && currentChannel) {
      currentChannel.url = line;
      currentChannel.id = `channel-${channels.length}`;

      // Channel zur Liste hinzufügen
      if (currentChannel.name && currentChannel.url) {
        channels.push(currentChannel as Channel);
      }

      currentChannel = null;
    }
  }

  return channels;
}

/**
 * Lädt und parst eine M3U Playlist von einer URL
 */
export async function loadM3UPlaylist(url: string): Promise<Channel[]> {
  try {
    const response = await fetch(url);
    const content = await response.text();
    return parseM3U(content);
  } catch (error) {
    console.error('Fehler beim Laden der M3U Playlist:', error);
    throw error;
  }
}

