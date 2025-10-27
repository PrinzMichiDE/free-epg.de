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
  ChevronLeftIcon,
  ChevronRightIcon,
  SignalIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  RectangleStackIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { loadM3UPlaylist, Channel } from '@/lib/m3u-parser';
import { getFavorites, toggleFavorite, isFavorite, addToHistory, getHistory } from '@/lib/favorites-storage';
import Hls from 'hls.js';

const PLAYLIST_URL = 'https://iptv-org.github.io/iptv/languages/deu.m3u';
const LAST_CHANNEL_KEY = 'epg_last_channel';

type FilterType = 'all' | 'favorites' | 'recent';
type ViewMode = 'normal' | 'theater' | 'mini';

interface StreamInfo {
  bitrate?: string;
  resolution?: string;
  codec?: string;
}

export function TvPlayerUltra() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(true);
  const [streamLoading, setStreamLoading] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [isPiP, setIsPiP] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('normal');
  const [streamInfo, setStreamInfo] = useState<StreamInfo>({});
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showQuickAccess, setShowQuickAccess] = useState(false);
  const [showStreamInfo, setShowStreamInfo] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const volumeTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Mount check
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Lade Playlist
  useEffect(() => {
    if (!isMounted) return;
    
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

        // Restore last channel
        if (typeof window !== 'undefined') {
          const lastChannelId = localStorage.getItem(LAST_CHANNEL_KEY);
          if (lastChannelId) {
            const lastChannel = channelList.find(ch => ch.id === lastChannelId);
            if (lastChannel) {
              setCurrentChannel(lastChannel);
              setIsPlayerOpen(true);
            }
          }
        }
      } catch (error) {
        console.error('Fehler beim Laden der Channels:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChannels();
  }, [isMounted]);

  // Load favorites and history
  useEffect(() => {
    setFavorites(getFavorites());
    setHistory(getHistory());
  }, []);

  // Video Player Setup with Error Handling
  useEffect(() => {
    if (!currentChannel || !videoRef.current) return;

    const video = videoRef.current;
    setStreamLoading(true);
    setStreamError(null);
    setStreamInfo({});

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
        
        hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
          setStreamLoading(false);
          video.play().catch((err) => {
            console.log('Autoplay verhindert:', err);
            setStreamError('Autoplay blockiert. Bitte Play drücken.');
          });
          
          // Stream Info
          if (data.levels && data.levels.length > 0) {
            const level = data.levels[0];
            setStreamInfo({
              bitrate: `${Math.round(level.bitrate / 1000)} kbps`,
              resolution: `${level.width}x${level.height}`,
              codec: level.videoCodec || 'H.264',
            });
          }
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            setStreamLoading(false);
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                setStreamError('Netzwerkfehler. Versuche neu zu verbinden...');
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                setStreamError('Medienfehler. Versuche Wiederherstellung...');
                hls.recoverMediaError();
                break;
              default:
                setStreamError('Stream konnte nicht geladen werden.');
                break;
            }
          }
        });

        hls.loadSource(currentChannel.url);
        hls.attachMedia(video);
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = currentChannel.url;
        video.addEventListener('loadedmetadata', () => {
          setStreamLoading(false);
          video.play().catch((err) => {
            console.log('Autoplay verhindert:', err);
            setStreamError('Autoplay blockiert. Bitte Play drücken.');
          });
        });
        video.addEventListener('error', () => {
          setStreamLoading(false);
          setStreamError('Stream konnte nicht geladen werden.');
        });
      }
    } else {
      video.src = currentChannel.url;
      video.addEventListener('loadeddata', () => setStreamLoading(false));
      video.addEventListener('error', () => {
        setStreamLoading(false);
        setStreamError('Stream konnte nicht geladen werden.');
      });
      video.play().catch((err) => {
        console.log('Autoplay verhindert:', err);
        setStreamError('Autoplay blockiert. Bitte Play drücken.');
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [currentChannel]);

  // Keyboard Shortcuts with Arrow Keys
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
        case 'arrowup':
          e.preventDefault();
          adjustVolume(0.1);
          break;
        case 'arrowdown':
          e.preventDefault();
          adjustVolume(-0.1);
          break;
        case 'arrowright':
          e.preventDefault();
          nextChannel();
          break;
        case 'arrowleft':
          e.preventDefault();
          previousChannel();
          break;
        case 'i':
          setShowStreamInfo(!showStreamInfo);
          break;
        case 'c':
          setShowQuickAccess(!showQuickAccess);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentChannel, showStreamInfo, showQuickAccess, channels]);

  // Volume Control
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);

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
    if (typeof window !== 'undefined') {
      localStorage.setItem(LAST_CHANNEL_KEY, channel.id);
    }
    setStreamError(null);
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

  const adjustVolume = (delta: number) => {
    const newVolume = Math.max(0, Math.min(1, volume + delta));
    setVolume(newVolume);
    setShowVolumeSlider(true);
    
    if (volumeTimeoutRef.current) {
      clearTimeout(volumeTimeoutRef.current);
    }
    volumeTimeoutRef.current = setTimeout(() => {
      setShowVolumeSlider(false);
    }, 2000);
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

  const nextChannel = () => {
    if (!currentChannel || sortedChannels.length === 0) return;
    const currentIndex = sortedChannels.findIndex(ch => ch.id === currentChannel.id);
    const nextIndex = (currentIndex + 1) % sortedChannels.length;
    handleChannelSelect(sortedChannels[nextIndex]);
  };

  const previousChannel = () => {
    if (!currentChannel || sortedChannels.length === 0) return;
    const currentIndex = sortedChannels.findIndex(ch => ch.id === currentChannel.id);
    const prevIndex = (currentIndex - 1 + sortedChannels.length) % sortedChannels.length;
    handleChannelSelect(sortedChannels[prevIndex]);
  };

  const retryStream = () => {
    if (currentChannel) {
      const temp = currentChannel;
      setCurrentChannel(null);
      setTimeout(() => setCurrentChannel(temp), 100);
    }
  };

  const getViewModeClass = () => {
    switch (viewMode) {
      case 'theater':
        return 'max-w-7xl mx-auto';
      case 'mini':
        return 'max-w-2xl';
      default:
        return '';
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
        className={`bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700 rounded-xl backdrop-blur-sm overflow-hidden ${getViewModeClass()}`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-b border-slate-700 p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <TvIcon className="w-6 md:w-8 h-6 md:h-8 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-white">Ultra Live TV Player</h2>
                <p className="text-slate-400 text-xs md:text-sm">
                  {channels.length} Sender • {favorites.length} Favoriten
                </p>
              </div>
            </div>

            {/* View Mode Switcher */}
            <div className="hidden md:flex items-center space-x-2 bg-slate-900/50 rounded-lg p-1">
              <button
                onClick={() => setViewMode('mini')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'mini' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Mini"
              >
                <RectangleStackIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('normal')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'normal' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Normal"
              >
                <Squares2X2Icon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('theater')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'theater' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Theater"
              >
                <ArrowsPointingOutIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Keyboard Shortcuts Info */}
          <div className="hidden lg:flex items-center flex-wrap gap-2 text-xs text-slate-400">
            <span>⌨️ Shortcuts:</span>
            <span className="px-2 py-1 bg-slate-700/50 rounded">Space = Play/Pause</span>
            <span className="px-2 py-1 bg-slate-700/50 rounded">←/→ = Sender wechseln</span>
            <span className="px-2 py-1 bg-slate-700/50 rounded">↑/↓ = Lautstärke</span>
            <span className="px-2 py-1 bg-slate-700/50 rounded">M = Mute</span>
            <span className="px-2 py-1 bg-slate-700/50 rounded">F = Fullscreen</span>
            <span className="px-2 py-1 bg-slate-700/50 rounded">I = Stream Info</span>
            <span className="px-2 py-1 bg-slate-700/50 rounded">C = Quick Access</span>
          </div>
        </div>

        {/* Video Player */}
        <AnimatePresence>
          {isPlayerOpen && currentChannel && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-black border-b border-slate-700 relative"
            >
              <div className="relative aspect-video">
                <video
                  ref={videoRef}
                  className="w-full h-full"
                  controls
                  playsInline
                />

                {/* Loading Overlay */}
                {streamLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                    <div className="text-center">
                      <ArrowPathIcon className="w-12 h-12 text-emerald-400 mx-auto mb-2 animate-spin" />
                      <p className="text-white">Lädt Stream...</p>
                    </div>
                  </div>
                )}

                {/* Error Overlay */}
                {streamError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                    <div className="text-center max-w-md p-6">
                      <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
                      <p className="text-white mb-4">{streamError}</p>
                      <button
                        onClick={retryStream}
                        className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition-colors"
                      >
                        Erneut versuchen
                      </button>
                    </div>
                  </div>
                )}

                {/* Volume Slider Overlay */}
                <AnimatePresence>
                  {showVolumeSlider && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-sm rounded-lg p-4 flex items-center space-x-3"
                    >
                      <SpeakerWaveIcon className="w-5 h-5 text-white" />
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="w-24"
                      />
                      <span className="text-white text-sm font-medium">{Math.round(volume * 100)}%</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Stream Info Overlay */}
                <AnimatePresence>
                  {showStreamInfo && streamInfo.bitrate && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-sm rounded-lg p-3 space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <SignalIcon className="w-4 h-4 text-emerald-400" />
                        <span className="text-white text-sm">{streamInfo.bitrate}</span>
                      </div>
                      {streamInfo.resolution && (
                        <p className="text-slate-400 text-xs">{streamInfo.resolution}</p>
                      )}
                      {streamInfo.codec && (
                        <p className="text-slate-400 text-xs">{streamInfo.codec}</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Control Buttons */}
                <div className="absolute top-4 right-4 flex gap-2">
                  {/* Previous Channel */}
                  <button
                    onClick={previousChannel}
                    className="p-2 bg-slate-900/80 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Vorheriger Sender (←)"
                  >
                    <ChevronLeftIcon className="w-5 h-5 text-white" />
                  </button>

                  {/* Next Channel */}
                  <button
                    onClick={nextChannel}
                    className="p-2 bg-slate-900/80 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Nächster Sender (→)"
                  >
                    <ChevronRightIcon className="w-5 h-5 text-white" />
                  </button>

                  {/* Stream Info Toggle */}
                  <button
                    onClick={() => setShowStreamInfo(!showStreamInfo)}
                    className="p-2 bg-slate-900/80 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Stream Info (I)"
                  >
                    <SignalIcon className="w-5 h-5 text-white" />
                  </button>

                  {/* Picture-in-Picture */}
                  {document.pictureInPictureEnabled && (
                    <button
                      onClick={togglePiP}
                      className="p-2 bg-slate-900/80 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Picture-in-Picture (P)"
                    >
                      <ArrowsPointingOutIcon className="w-5 h-5 text-white" />
                    </button>
                  )}

                  {/* Mute */}
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

                  {/* Close Player */}
                  <button
                    onClick={() => setIsPlayerOpen(false)}
                    className="p-2 bg-slate-900/80 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Channel Info Bar */}
              <div className="bg-slate-900/50 p-4 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {currentChannel.logo && (
                      <img
                        src={currentChannel.logo}
                        alt={currentChannel.name}
                        className="w-8 h-8 object-contain rounded"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <div>
                      <p className="text-white font-medium">{currentChannel.name}</p>
                      {currentChannel.group && (
                        <p className="text-slate-400 text-sm">{currentChannel.group}</p>
                      )}
                    </div>
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
            {sortedChannels.map((channel, index) => (
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
                  {/* Channel Number */}
                  <div className="absolute top-1 left-1 bg-slate-900/80 text-slate-400 text-xs px-1.5 py-0.5 rounded">
                    #{index + 1}
                  </div>
                  
                  <div className="flex flex-col items-center space-y-2 mt-2">
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

