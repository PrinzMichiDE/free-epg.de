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
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { loadM3UPlaylist, Channel } from '@/lib/m3u-parser';
import Hls from 'hls.js';

const PLAYLIST_URL = 'https://iptv-org.github.io/iptv/languages/deu.m3u';

export function PwaTvPlayer() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Lade Playlist
  useEffect(() => {
    const loadChannels = async () => {
      try {
        const channelList = await loadM3UPlaylist(PLAYLIST_URL);
        setChannels(channelList);
      } catch (error) {
        console.error('Fehler beim Laden der Channels:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChannels();
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

  const filteredChannels = channels.filter((channel) =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChannelSelect = (channel: Channel) => {
    setCurrentChannel(channel);
    setShowMenu(false);
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
          <button
            onClick={() => setShowInfo(true)}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <InformationCircleIcon className="w-6 h-6 text-slate-400" />
          </button>
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
              className="absolute bottom-0 left-0 right-0 bg-slate-800 rounded-t-3xl max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Menu Header */}
              <div className="p-4 border-b border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-white font-bold text-xl">Sender wählen</h2>
                  <button
                    onClick={() => setShowMenu(false)}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6 text-white" />
                  </button>
                </div>
                
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {filteredChannels.map((channel) => (
                    <button
                      key={channel.id}
                      onClick={() => handleChannelSelect(channel)}
                      className={`p-4 rounded-lg border transition-all ${
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
                        <span className="text-white text-xs font-medium text-center line-clamp-2">
                          {channel.name}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {filteredChannels.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-slate-400">Keine Sender gefunden</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Modal */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowInfo(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-800 rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center space-x-3 mb-4">
                <TvIcon className="w-8 h-8 text-emerald-400" />
                <h3 className="text-white font-bold text-xl">Live TV Player</h3>
              </div>
              <div className="space-y-3 text-slate-300 text-sm mb-6">
                <p className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  <span><strong>{channels.length}</strong> deutsche Sender verfügbar</span>
                </p>
                <p className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span>HLS/M3U8 Streaming</span>
                </p>
                <p className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <span>Kostenlos & werbefrei</span>
                </p>
              </div>
              <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 mb-6">
                <p className="text-slate-400 text-xs">
                  <strong className="text-white">Tipp:</strong> Für EPG-Daten und weitere Features besuche die Website.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={openWebsite}
                  className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                >
                  <HomeIcon className="w-5 h-5" />
                  <span>Mehr Features</span>
                </button>
                <button
                  onClick={() => setShowInfo(false)}
                  className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors"
                >
                  Schließen
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

