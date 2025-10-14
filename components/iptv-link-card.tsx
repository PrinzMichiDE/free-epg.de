'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { 
  TvIcon, 
  DocumentDuplicateIcon, 
  CheckIcon,
  LinkIcon,
  QrCodeIcon
} from '@heroicons/react/24/outline';

export function IptvLinkCard() {
  const [copied, setCopied] = useState(false);
  const [epgUrl, setEpgUrl] = useState('');

  useEffect(() => {
    // URL dynamisch erstellen (client-side)
    if (typeof window !== 'undefined') {
      setEpgUrl(`${window.location.origin}/api/epg`);
    }
  }, []);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(epgUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Fehler beim Kopieren:', err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1 }}
      className="relative overflow-hidden"
    >
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-blue-500/20 to-purple-500/20">
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent animate-pulse"></div>
      </div>

      {/* Main Card */}
      <div className="relative bg-slate-800/80 backdrop-blur-xl border-2 border-emerald-500/50 rounded-2xl p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-xl shadow-lg">
              <TvIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">IPTV EPG URL</h2>
              <p className="text-sm text-slate-400">Für deine IPTV App</p>
            </div>
          </div>
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3
            }}
          >
            <LinkIcon className="w-8 h-8 text-emerald-400" />
          </motion.div>
        </div>

        {/* URL Display */}
        <div className="bg-slate-900/80 border-2 border-emerald-500/30 rounded-xl p-6 mb-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              EPG Endpoint
            </span>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs text-emerald-400 font-medium">Live</span>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-950/50 rounded-lg p-4 mb-4">
            <code className="text-emerald-300 font-mono text-base md:text-lg break-all leading-relaxed">
              {epgUrl || 'Lädt...'}
            </code>
          </div>

          {/* Copy Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={copyToClipboard}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 shadow-lg ${
              copied
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-green-500/50'
                : 'bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 shadow-emerald-500/50'
            }`}
          >
            <div className="flex items-center justify-center space-x-3">
              {copied ? (
                <>
                  <CheckIcon className="w-6 h-6" />
                  <span className="text-lg">URL kopiert!</span>
                </>
              ) : (
                <>
                  <DocumentDuplicateIcon className="w-6 h-6" />
                  <span className="text-lg">URL kopieren</span>
                </>
              )}
            </div>
          </motion.button>
        </div>

        {/* Instructions */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center">
            <QrCodeIcon className="w-4 h-4 mr-2 text-emerald-400" />
            So verwendest du die URL:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-3">
              <div className="text-emerald-400 font-bold text-lg mb-1">1.</div>
              <p className="text-slate-300 text-sm">
                URL kopieren
              </p>
            </div>
            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-3">
              <div className="text-blue-400 font-bold text-lg mb-1">2.</div>
              <p className="text-slate-300 text-sm">
                In IPTV App einfügen
              </p>
            </div>
            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-3">
              <div className="text-purple-400 font-bold text-lg mb-1">3.</div>
              <p className="text-slate-300 text-sm">
                EPG aktualisieren
              </p>
            </div>
          </div>
        </div>

        {/* Compatible Apps Info */}
        <div className="mt-6 pt-6 border-t border-slate-700">
          <p className="text-xs text-slate-400 text-center">
            Kompatibel mit: TiviMate, IPTV Smarters Pro, Perfect Player und vielen anderen IPTV Apps
          </p>
        </div>
      </div>
    </motion.div>
  );
}

