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
  ArrowsPointingOutIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { loadM3UPlaylist, Channel } from '@/lib/m3u-parser';
import { getFavorites, toggleFavorite, isFavorite, addToHistory, getHistory } from '@/lib/favorites-storage';
import Hls from 'hls.js';

const PLAYLIST_URL = 'https://iptv-org.github.io/iptv/languages/deu.m3u';
const LAST_CHANNEL_KEY = 'epg_last_channel';

type FilterType = 'all' | 'favorites' | 'recent';

interface StreamInfo {
  bitrate?: string;
  resolution?: string;
  codec?: string;
}

export function PwaTvPlayerEnhanced() {
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
  const [isPiP, setIsPiP] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [streamInfo, setStreamInfo] = useState<StreamInfo>({});
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const volumeTimeoutRef = useRef<NodeJS.Timeout>();

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

        // Restore last channel
        const lastChannelId = localStorage.getItem(LAST_CHANNEL_KEY);
        if (lastChannelId) {
          const lastChannel = channelList.find(ch => ch.id === lastChannelId);
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
  }, []);

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
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentChannel, channels]);

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

  // Volume Control
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);

  const handleChannelSelect = (channel: Channel) => {
    setCurrentChannel(channel);
    setShowMenu(false);
    addToHistory(channel.id);
    setHistory(getHistory());
    localStorage.setItem(LAST_CHANNEL_KEY, channel.id);
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

  const openWebsite = () => {
    window.open(window.location.origin, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <TvIcon className="w-16 h-16 text-emerald-400 mx-auto mb-4 animate-pulse" />
          <p className="text-white text-lg">Lade Sender...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <TvIcon className="w-6 h-6 text-emerald-400" />
          <h1 className="text-white font-bold text-lg">Live TV</h1>
          {currentChannel && (
            <span className="text-slate-400 text-sm truncate max-w-[150px] sm:max-w-none">
              {currentChannel.name}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {currentChannel && (
            <>
              {document.pictureInPictureEnabled && (
                <button
                  onClick={togglePiP}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  title="Picture-in-Picture"
                >
                  <ArrowsPointingOutIcon className="w-5 h-5 text-slate-400" />
                </button>
              )}
              <button
                onClick={toggleMute}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                title="Mute"
              >
                {isMuted ? (
                  <SpeakerXMarkIcon className="w-5 h-5 text-slate-400" />
                ) : (
                  <SpeakerWaveIcon className="w-5 h-5 text-slate-400" />
                )}
              </button>
              <button
                onClick={(e) => currentChannel && handleToggleFavorite(currentChannel.id, e)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                {currentChannel && isFavorite(currentChannel.id) ? (
                  <StarSolidIcon className="w-5 h-5 text-yellow-400" />
                ) : (
                  <StarIcon className="w-5 h-5 text-slate-400" />
                )}
              </button>
            </>
          )}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Bars3Icon className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      {/* Video Player */}
      <div className="flex-1 bg-black">
        {currentChannel ? (
          <video
            ref={videoRef}
            className="w-full h-full"
            controls
            playsInline
            autoPlay
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center p-8">
              <TvIcon className="w-20 h-20 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg mb-4">Wähle einen Sender</p>
              <button
                onClick={() => setShowMenu(true)}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition-colors"
              >
                Sender auswählen
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Channel Menu Overlay */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={() => setShowMenu(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 right-0 bg-slate-800 rounded-t-3xl max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Menu Header */}
              <div className="p-4 border-b border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-white font-bold text-xl">Sender wählen</h2>
                    <p className="text-slate-400 text-sm">{channels.length} Sender • {favorites.length} Favoriten</p>
                  </div>
                  <button
                    onClick={() => setShowMenu(false)}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6 text-white" />
                  </button>
                </div>

                {/* Filters */}
                <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                      filter === 'all'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    Alle
                  </button>
                  <button
                    onClick={() => setFilter('favorites')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
                      filter === 'favorites'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    <StarIcon className="w-4 h-4" />
                    Favoriten
                  </button>
                  <button
                    onClick={() => setFilter('recent')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
                      filter === 'recent'
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    <ClockIcon className="w-4 h-4" />
                    Zuletzt
                  </button>
                  <button
                    onClick={openWebsite}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all bg-purple-600 text-white flex items-center gap-1"
                  >
                    <HomeIcon className="w-4 h-4" />
                    Mehr Features
                  </button>
                </div>

                {/* Category Filter */}
                {categories.length > 0 && (
                  <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-2">
                    <FunnelIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${
                        selectedCategory === 'all'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      Alle
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${
                          selectedCategory === cat
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Search */}
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Sender suchen..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Channel Grid */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {sortedChannels.map((channel) => (
                    <div key={channel.id} className="relative group">
                      <button
                        onClick={() => handleChannelSelect(channel)}
                        className={`w-full p-3 rounded-lg border transition-all ${
                          currentChannel?.id === channel.id
                            ? 'bg-emerald-500/20 border-emerald-500'
                            : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex flex-col items-center space-y-2">
                          {channel.logo ? (
                            <img
                              src={channel.logo}
                              alt={channel.name}
                              className="w-10 h-10 object-contain rounded"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 bg-slate-700 rounded flex items-center justify-center">
                              <PlayIcon className="w-5 h-5 text-slate-400" />
                            </div>
                          )}
                          <span className="text-white text-xs font-medium text-center line-clamp-2">
                            {channel.name}
                          </span>
                        </div>
                      </button>
                      
                      {/* Favorite Button */}
                      <button
                        onClick={(e) => handleToggleFavorite(channel.id, e)}
                        className="absolute top-1 right-1 p-1 bg-slate-900/80 hover:bg-slate-800 rounded transition-colors opacity-0 group-hover:opacity-100"
                      >
                        {isFavorite(channel.id) ? (
                          <StarSolidIcon className="w-4 h-4 text-yellow-400" />
                        ) : (
                          <StarIcon className="w-4 h-4 text-white" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>

                {sortedChannels.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-slate-400">Keine Sender gefunden</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

