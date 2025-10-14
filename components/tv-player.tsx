'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlayIcon,
  TvIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { loadM3UPlaylist, Channel } from '@/lib/m3u-parser';
import Hls from 'hls.js';

const PLAYLIST_URL = 'https://iptv-org.github.io/iptv/languages/deu.m3u';

export function TvPlayer() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
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
        // Native HLS Support (Safari)
        video.src = currentChannel.url;
        video.addEventListener('loadedmetadata', () => {
          video.play().catch((err) => console.log('Autoplay verhindert:', err));
        });
      }
    } else {
      // Direkter Stream
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
    setIsPlayerOpen(true);
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
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-b border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <TvIcon className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Live TV Player</h2>
                <p className="text-slate-400 text-sm">
                  {channels.length} deutsche Sender verfügbar
                </p>
              </div>
            </div>
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
                <button
                  onClick={() => setIsPlayerOpen(false)}
                  className="absolute top-4 right-4 p-2 bg-slate-900/80 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-6 h-6 text-white" />
                </button>
              </div>
              <div className="bg-slate-900/50 p-4 border-t border-slate-800">
                <p className="text-white font-medium">{currentChannel.name}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search */}
        <div className="p-6 border-b border-slate-700">
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
            {filteredChannels.map((channel) => (
              <motion.button
                key={channel.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleChannelSelect(channel)}
                className={`p-3 md:p-4 rounded-lg border transition-all active:scale-95 touch-manipulation ${
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
              </motion.button>
            ))}
          </div>

          {filteredChannels.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-400">Keine Sender gefunden</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

