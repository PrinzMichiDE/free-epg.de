/**
 * LocalStorage Service für Favoriten
 */

const FAVORITES_KEY = 'epg_favorites';
const HISTORY_KEY = 'epg_history';

export function getFavorites(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const favorites = localStorage.getItem(FAVORITES_KEY);
    return favorites ? JSON.parse(favorites) : [];
  } catch {
    return [];
  }
}

export function addFavorite(channelId: string): void {
  const favorites = getFavorites();
  if (!favorites.includes(channelId)) {
    favorites.push(channelId);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }
}

export function removeFavorite(channelId: string): void {
  const favorites = getFavorites();
  const filtered = favorites.filter((id) => id !== channelId);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));
}

export function isFavorite(channelId: string): boolean {
  return getFavorites().includes(channelId);
}

export function toggleFavorite(channelId: string): boolean {
  if (isFavorite(channelId)) {
    removeFavorite(channelId);
    return false;
  } else {
    addFavorite(channelId);
    return true;
  }
}

// History Management
export function addToHistory(channelId: string): void {
  if (typeof window === 'undefined') return;
  try {
    let history = getHistory();
    // Remove if exists
    history = history.filter((id) => id !== channelId);
    // Add to front
    history.unshift(channelId);
    // Keep only last 10
    history = history.slice(0, 10);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Fehler beim Speichern der Historie:', error);
  }
}

export function getHistory(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const history = localStorage.getItem(HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch {
    return [];
  }
}

