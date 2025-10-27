'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlayIcon,
  TvIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  StarIcon,
  ClockIcon,
  Squares2X2Icon,
  FunnelIcon,
  ArrowsPointingOutIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { loadM3UPlaylist, Channel } from '@/lib/m3u-parser';
import { getFavorites, toggleFavorite, isFavorite, addToHistory, getHistory } from '@/lib/favorites-storage';
import Hls from 'hls.js';

const PLAYLIST_URL = 'https://iptv-org.github.io/iptv/languages/deu.m3u';

type FilterType = 'all' | 'favorites' | 'recent';

export function TvPlayerEnhanced() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [isPiP, setIsPiP] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Lade Playlist
  useEffect(() => {
    const loadChannels = async () => {
      try {
        const channelList = await loadM3UPlaylist(PLAYLIST_URL);
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
      } catch (error) {
        console.error('Fehler beim Laden der Channels:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChannels();
  }, []);

  // Load favorites and history
  useEffect(() => {
    setFavorites(getFavorites());
    setHistory(getHistory());
  }, []);

  // Video Player Setup
  useEffect(() => {
    if (!currentChannel || !videoRef.current) return;

    const video = videoRef.current;

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
        });
        hlsRef.current = hls;
        hls.loadSource(currentChannel.url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch((err) => console.log('Autoplay verhindert:', err));
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = currentChannel.url;
        video.addEventListener('loadedmetadata', () => {
          video.play().catch((err) => console.log('Autoplay verhindert:', err));
        });
      }
    } else {
      video.src = currentChannel.url;
      video.play().catch((err) => console.log('Autoplay verhindert:', err));
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [currentChannel]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!videoRef.current) return;
      
      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          if (videoRef.current.paused) {
            videoRef.current.play();
          } else {
            videoRef.current.pause();
          }
          break;
        case 'm':
          toggleMute();
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'p':
          if (document.pictureInPictureEnabled) {
            togglePiP();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const filteredChannels = channels.filter((channel) => {
    const matchesSearch = channel.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || channel.group === selectedCategory;
    
    if (filter === 'favorites') {
      return matchesSearch && matchesCategory && favorites.includes(channel.id);
    } else if (filter === 'recent') {
      return matchesSearch && matchesCategory && history.includes(channel.id);
    }
    return matchesSearch && matchesCategory;
  });

  // Sort by favorites, then recent, then alphabetically
  const sortedChannels = [...filteredChannels].sort((a, b) => {
    const aFav = favorites.includes(a.id);
    const bFav = favorites.includes(b.id);
    if (aFav && !bFav) return -1;
    if (!aFav && bFav) return 1;
    return a.name.localeCompare(b.name);
  });

  const handleChannelSelect = (channel: Channel) => {
    setCurrentChannel(channel);
    setIsPlayerOpen(true);
    addToHistory(channel.id);
    setHistory(getHistory());
  };

  const handleToggleFavorite = (channelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(channelId);
    setFavorites(getFavorites());
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoRef.current.requestFullscreen();
    }
  };

  const togglePiP = async () => {
    if (!videoRef.current || !document.pictureInPictureEnabled) return;
    
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiP(false);
      } else {
        await videoRef.current.requestPictureInPicture();
        setIsPiP(true);
      }
    } catch (error) {
      console.error('PiP Fehler:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 backdrop-blur-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-700 rounded w-1/3"></div>
          <div className="h-64 bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div id="tv-player" className="mb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700 rounded-xl backdrop-blur-sm overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-b border-slate-700 p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <TvIcon className="w-6 md:w-8 h-6 md:h-8 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-white">Enhanced Live TV Player</h2>
                <p className="text-slate-400 text-xs md:text-sm">
                  {channels.length} Sender • {favorites.length} Favoriten
                </p>
              </div>
            </div>
          </div>

          {/* Keyboard Shortcuts Info */}
          <div className="hidden md:flex items-center space-x-4 text-xs text-slate-400">
            <span>⌨️ Shortcuts:</span>
            <span className="px-2 py-1 bg-slate-700/50 rounded">Space = Play/Pause</span>
            <span className="px-2 py-1 bg-slate-700/50 rounded">M = Mute</span>
            <span className="px-2 py-1 bg-slate-700/50 rounded">F = Fullscreen</span>
            <span className="px-2 py-1 bg-slate-700/50 rounded">P = Picture-in-Picture</span>
          </div>
        </div>

        {/* Video Player */}
        <AnimatePresence>
          {isPlayerOpen && currentChannel && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-black border-b border-slate-700"
            >
              <div className="relative aspect-video">
                <video
                  ref={videoRef}
                  className="w-full h-full"
                  controls
                  playsInline
                />
                <div className="absolute top-4 right-4 flex gap-2">
                  {document.pictureInPictureEnabled && (
                    <button
                      onClick={togglePiP}
                      className="p-2 bg-slate-900/80 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Picture-in-Picture (P)"
                    >
                      <ArrowsPointingOutIcon className="w-5 h-5 text-white" />
                    </button>
                  )}
                  <button
                    onClick={toggleMute}
                    className="p-2 bg-slate-900/80 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Mute (M)"
                  >
                    {isMuted ? (
                      <SpeakerXMarkIcon className="w-5 h-5 text-white" />
                    ) : (
                      <SpeakerWaveIcon className="w-5 h-5 text-white" />
                    )}
                  </button>
                  <button
                    onClick={() => setIsPlayerOpen(false)}
                    className="p-2 bg-slate-900/80 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
              <div className="bg-slate-900/50 p-4 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{currentChannel.name}</p>
                    {currentChannel.group && (
                      <p className="text-slate-400 text-sm">{currentChannel.group}</p>
                    )}
                  </div>
                  <button
                    onClick={(e) => handleToggleFavorite(currentChannel.id, e)}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    {isFavorite(currentChannel.id) ? (
                      <StarSolidIcon className="w-6 h-6 text-yellow-400" />
                    ) : (
                      <StarIcon className="w-6 h-6 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters */}
        <div className="p-4 md:p-6 border-b border-slate-700">
          <div className="flex flex-wrap gap-3 mb-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                filter === 'all'
                  ? 'bg-purple-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <Squares2X2Icon className="w-4 h-4 inline mr-2" />
              Alle ({channels.length})
            </button>
            <button
              onClick={() => setFilter('favorites')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                filter === 'favorites'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <StarIcon className="w-4 h-4 inline mr-2" />
              Favoriten ({favorites.length})
            </button>
            <button
              onClick={() => setFilter('recent')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                filter === 'recent'
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <ClockIcon className="w-4 h-4 inline mr-2" />
              Zuletzt ({history.length})
            </button>
          </div>

          {/* Category Filter */}
          {categories.length > 0 && (
            <div className="flex items-center space-x-2 mb-4 overflow-x-auto pb-2">
              <FunnelIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Alle
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Sender suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        </div>

        {/* Channel List */}
        <div className="p-4 md:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3 max-h-96 overflow-y-auto overscroll-contain">
            {sortedChannels.map((channel) => (
              <motion.div
                key={channel.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative group"
              >
                <button
                  onClick={() => handleChannelSelect(channel)}
                  className={`w-full p-3 md:p-4 rounded-lg border transition-all active:scale-95 touch-manipulation ${
                    currentChannel?.id === channel.id
                      ? 'bg-purple-500/20 border-purple-500'
                      : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex flex-col items-center space-y-2">
                    {channel.logo ? (
                      <img
                        src={channel.logo}
                        alt={channel.name}
                        className="w-12 h-12 object-contain rounded"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 bg-slate-700 rounded flex items-center justify-center">
                        <PlayIcon className="w-6 h-6 text-slate-400" />
                      </div>
                    )}
                    <span className="text-white text-xs md:text-sm font-medium text-center line-clamp-2 break-words">
                      {channel.name}
                    </span>
                  </div>
                </button>
                
                {/* Favorite Button */}
                <button
                  onClick={(e) => handleToggleFavorite(channel.id, e)}
                  className="absolute top-2 right-2 p-1.5 bg-slate-900/80 hover:bg-slate-800 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                  {isFavorite(channel.id) ? (
                    <StarSolidIcon className="w-4 h-4 text-yellow-400" />
                  ) : (
                    <StarIcon className="w-4 h-4 text-white" />
                  )}
                </button>
              </motion.div>
            ))}
          </div>

          {sortedChannels.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-400">Keine Sender gefunden</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

