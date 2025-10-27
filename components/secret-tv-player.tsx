'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlayIcon,
  TvIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  Bars3Icon,
  HomeIcon,
  StarIcon,
  ClockIcon,
  FunnelIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { loadM3UPlaylist, Channel } from '@/lib/m3u-parser';
import { getFavorites, toggleFavorite, isFavorite, addToHistory, getHistory } from '@/lib/favorites-storage';
import { PinLock } from '@/components/pin-lock';
import Hls from 'hls.js';

const LAST_CHANNEL_KEY = 'epg_secret_last_channel';
const AUTH_KEY = 'epg_secret_auth';

type FilterType = 'all' | 'favorites' | 'recent';

interface StreamInfo {
  bitrate?: string;
  resolution?: string;
  codec?: string;
}

interface SecretTvPlayerProps {
  playlistUrl: string;
  requiredPin?: string;
}

export function SecretTvPlayer({ playlistUrl, requiredPin }: SecretTvPlayerProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(true);
  const [streamLoading, setStreamLoading] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [streamInfo, setStreamInfo] = useState<StreamInfo>({});
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Check authentication on mount
  useEffect(() => {
    if (!requiredPin) {
      // Kein PIN erforderlich, direkt authentifiziert
      setIsAuthenticated(true);
      return;
    }

    // Prüfe ob bereits authentifiziert (in dieser Session)
    const authStatus = sessionStorage.getItem(AUTH_KEY);
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, [requiredPin]);

  const handleUnlock = () => {
    setIsAuthenticated(true);
    sessionStorage.setItem(AUTH_KEY, 'true');
  };

  // Zeige PIN-Lock wenn PIN erforderlich und nicht authentifiziert
  if (requiredPin && !isAuthenticated) {
    return <PinLock onUnlock={handleUnlock} requiredPin={requiredPin} />;
  }

  // Lade Playlist
  useEffect(() => {
    const loadChannels = async () => {
      try {
        const channelList = await loadM3UPlaylist(playlistUrl);
        setChannels(channelList);
        
        // Extract unique categories
        const cats = Array.from(
          new Set(
            channelList
              .map((ch) => ch.group)
              .filter((g): g is string => !!g)
          )
        );
        setCategories(cats);

        // Load last played channel
        const lastChannelId = localStorage.getItem(LAST_CHANNEL_KEY);
        if (lastChannelId) {
          const lastChannel = channelList.find((ch) => ch.id === lastChannelId);
          if (lastChannel) {
            setCurrentChannel(lastChannel);
          }
        }
      } catch (error) {
        console.error('Fehler beim Laden der Channels:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChannels();
  }, [playlistUrl]);

  // Load favorites and history
  useEffect(() => {
    setFavorites(getFavorites());
    setHistory(getHistory());
  }, []);

  // Video Player Setup
  useEffect(() => {
    if (!currentChannel || !videoRef.current) return;

    const video = videoRef.current;
    setStreamLoading(true);
    setStreamError(null);

    // Cleanup vorheriger HLS Instanz
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // HLS Stream
    if (currentChannel.url.includes('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
        });
        hlsRef.current = hls;
        
        hls.loadSource(currentChannel.url);
        hls.attachMedia(video);
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setStreamLoading(false);
          video.play().catch((err) => {
            console.log('Autoplay verhindert:', err);
            setStreamError('Bitte klicke auf Play');
          });
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            setStreamLoading(false);
            setStreamError('Stream konnte nicht geladen werden');
          }
        });

        // Stream Info
        hls.on(Hls.Events.LEVEL_LOADED, (event, data) => {
          setStreamInfo({
            bitrate: `${Math.round(data.details.totalduration)} s`,
            resolution: `${data.details.fragments.length} Fragmente`,
          });
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = currentChannel.url;
        video.addEventListener('loadedmetadata', () => {
          setStreamLoading(false);
          video.play().catch((err) => {
            console.log('Autoplay verhindert:', err);
            setStreamError('Bitte klicke auf Play');
          });
        });
      }
    } else {
      video.src = currentChannel.url;
      video.addEventListener('loadeddata', () => {
        setStreamLoading(false);
      });
      video.play().catch((err) => {
        console.log('Autoplay verhindert:', err);
        setStreamError('Bitte klicke auf Play');
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [currentChannel]);

  // Volume Control
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  const handleChannelSelect = (channel: Channel) => {
    setCurrentChannel(channel);
    setShowMenu(false);
    
    // Save to history
    addToHistory(channel.id);
    setHistory(getHistory());
    
    // Save as last played
    localStorage.setItem(LAST_CHANNEL_KEY, channel.id);
  };

  const handleToggleFavorite = (channelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(channelId);
    setFavorites(getFavorites());
  };

  const getFilteredChannels = () => {
    let filtered = channels;

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((ch) => ch.group === selectedCategory);
    }

    // Apply type filter
    if (filter === 'favorites') {
      filtered = filtered.filter((ch) => favorites.includes(ch.id));
    } else if (filter === 'recent') {
      const recentChannels = history
        .map((id) => channels.find((ch) => ch.id === id))
        .filter((ch): ch is Channel => !!ch);
      filtered = recentChannels;
    }

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter((ch) =>
        ch.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredChannels = getFilteredChannels();

  const openWebsite = () => {
    window.open(window.location.origin, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <TvIcon className="w-16 h-16 text-emerald-400 mx-auto mb-4 animate-pulse" />
            <LockClosedIcon className="w-6 h-6 text-emerald-300 absolute top-0 right-0" />
          </div>
          <p className="text-white text-lg">Lade geheime Sender...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <TvIcon className="w-8 h-8 text-emerald-400" />
              <LockClosedIcon className="w-4 h-4 text-emerald-300 absolute -top-1 -right-1" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">Secret TV</h1>
              <p className="text-slate-400 text-xs">{channels.length} Sender</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={openWebsite}
              className="p-2 rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 transition-colors"
              title="Zur Website"
            >
              <HomeIcon className="w-6 h-6" />
            </button>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Video Player */}
      <div className="flex-1 relative bg-black">
        {currentChannel ? (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              controls
              playsInline
              autoPlay
            />
            
            {/* Stream Loading Overlay */}
            {streamLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-white">Lade Stream...</p>
                </div>
              </div>
            )}

            {/* Stream Error */}
            {streamError && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-red-500/90 text-white px-4 py-2 rounded-lg shadow-lg">
                  {streamError}
                </div>
              </div>
            )}

            {/* Current Channel Info */}
            <div className="absolute bottom-20 left-4 right-4">
              <div className="bg-slate-900/90 backdrop-blur-sm rounded-lg p-4 shadow-xl">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-white font-bold text-lg truncate">
                      {currentChannel.name}
                    </h2>
                    {currentChannel.group && (
                      <p className="text-emerald-400 text-sm">{currentChannel.group}</p>
                    )}
                  </div>
                  <button
                    onClick={(e) => handleToggleFavorite(currentChannel.id, e)}
                    className="ml-3 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                  >
                    {isFavorite(currentChannel.id) ? (
                      <StarSolidIcon className="w-6 h-6 text-yellow-400" />
                    ) : (
                      <StarIcon className="w-6 h-6 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Volume Control */}
            <div className="absolute bottom-4 right-4">
              <div className="flex items-center space-x-2 bg-slate-900/90 backdrop-blur-sm rounded-lg p-2">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
                  onMouseEnter={() => setShowVolumeSlider(true)}
                >
                  {isMuted ? (
                    <SpeakerXMarkIcon className="w-6 h-6 text-slate-300" />
                  ) : (
                    <SpeakerWaveIcon className="w-6 h-6 text-emerald-400" />
                  )}
                </button>
                {showVolumeSlider && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    onMouseLeave={() => setShowVolumeSlider(false)}
                  >
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={(e) => {
                        setVolume(parseFloat(e.target.value));
                        setIsMuted(false);
                      }}
                      className="w-24"
                    />
                  </motion.div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <PlayIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">Wähle einen Sender aus dem Menü</p>
            </div>
          </div>
        )}
      </div>

      {/* Channel Menu Sidebar */}
      <AnimatePresence>
        {showMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMenu(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />

            {/* Sidebar */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-slate-800 z-50 flex flex-col shadow-2xl"
            >
              {/* Menu Header */}
              <div className="p-4 border-b border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-white font-bold text-xl">Sender</h2>
                  <button
                    onClick={() => setShowMenu(false)}
                    className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6 text-slate-300" />
                  </button>
                </div>

                {/* Search */}
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Sender suchen..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Filters */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setFilter('all')}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === 'all'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    Alle
                  </button>
                  <button
                    onClick={() => setFilter('favorites')}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
                      filter === 'favorites'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <StarIcon className="w-4 h-4 mr-1" />
                    Favoriten
                  </button>
                  <button
                    onClick={() => setFilter('recent')}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
                      filter === 'recent'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <ClockIcon className="w-4 h-4 mr-1" />
                    Zuletzt
                  </button>
                </div>

                {/* Category Filter */}
                {categories.length > 0 && (
                  <div className="mt-3">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="all">Alle Kategorien</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Channel List */}
              <div className="flex-1 overflow-y-auto">
                {filteredChannels.length === 0 ? (
                  <div className="text-center py-12">
                    <FunnelIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">Keine Sender gefunden</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-700">
                    {filteredChannels.map((channel) => (
                      <button
                        key={channel.id}
                        onClick={() => handleChannelSelect(channel)}
                        className={`w-full px-4 py-3 text-left hover:bg-slate-700/50 transition-colors flex items-center justify-between ${
                          currentChannel?.id === channel.id ? 'bg-emerald-900/30' : ''
                        }`}
                      >
                        <div className="flex items-center flex-1 min-w-0">
                          {channel.logo ? (
                            <img
                              src={channel.logo}
                              alt={channel.name}
                              className="w-10 h-10 rounded-lg object-cover mr-3"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center mr-3">
                              <TvIcon className="w-5 h-5 text-slate-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">{channel.name}</p>
                            {channel.group && (
                              <p className="text-slate-400 text-xs truncate">{channel.group}</p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => handleToggleFavorite(channel.id, e)}
                          className="ml-2 p-1"
                        >
                          {isFavorite(channel.id) ? (
                            <StarSolidIcon className="w-5 h-5 text-yellow-400" />
                          ) : (
                            <StarIcon className="w-5 h-5 text-slate-500" />
                          )}
                        </button>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

