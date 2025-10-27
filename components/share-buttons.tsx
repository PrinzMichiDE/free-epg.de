'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShareIcon,
  LinkIcon,
  CheckIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';

export function ShareButtons() {
  const [epgUrl, setEpgUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [shareCount, setShareCount] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setEpgUrl(`${window.location.origin}/api/epg`);
    }
    
    // Lade Share Count
    fetch('/api/share')
      .then(res => res.json())
      .then(data => setShareCount(data.shareCount))
      .catch(console.error);
  }, []);

  const trackShare = async () => {
    try {
      const res = await fetch('/api/share', { method: 'POST' });
      const data = await res.json();
      setShareCount(data.shareCount);
    } catch (error) {
      console.error('Fehler beim Tracking:', error);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(epgUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Fehler beim Kopieren:', err);
    }
  };

  const shareViaEmail = () => {
    trackShare();
    const subject = encodeURIComponent('EPG Service - Electronic Program Guide');
    const body = encodeURIComponent(
      `Hallo!\n\nIch nutze diesen kostenlosen EPG Service:\n\nEPG URL: ${epgUrl}\n\nWebsite: ${window.location.origin}\n\nViele Grüße`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const shareViaWhatsApp = () => {
    trackShare();
    const text = encodeURIComponent(
      `EPG Service - Kostenloser Electronic Program Guide\n\nEPG URL: ${epgUrl}\n\n${window.location.origin}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareViaTelegram = () => {
    trackShare();
    const text = encodeURIComponent(
      `EPG Service - Kostenloser EPG für IPTV\n\nEPG URL: ${epgUrl}\n\n${window.location.origin}`
    );
    window.open(`https://t.me/share/url?url=${window.location.origin}&text=${text}`, '_blank');
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'EPG Service',
          text: 'Kostenloser EPG Service für IPTV',
          url: window.location.origin,
        });
        trackShare();
      } catch (err) {
        console.log('Share abgebrochen:', err);
      }
    }
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <ShareIcon className="w-6 h-6 text-pink-400" />
          <h3 className="text-xl font-semibold text-white">Teilen</h3>
        </div>
        {shareCount > 0 && (
          <div className="text-right">
            <p className="text-2xl font-bold text-emerald-400">{shareCount}</p>
            <p className="text-slate-400 text-xs">Mal geteilt</p>
          </div>
        )}
      </div>

      <p className="text-slate-400 text-sm mb-6">
        Teile den EPG Service mit Freunden und Familie
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {/* Copy Link */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={copyLink}
          className={`p-4 rounded-lg border transition-all ${
            copied
              ? 'bg-emerald-500/20 border-emerald-500'
              : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
          }`}
        >
          <div className="flex flex-col items-center space-y-2">
            {copied ? (
              <CheckIcon className="w-6 h-6 text-emerald-400" />
            ) : (
              <LinkIcon className="w-6 h-6 text-slate-400" />
            )}
            <span className="text-white text-sm font-medium">
              {copied ? 'Kopiert!' : 'Link'}
            </span>
          </div>
        </motion.button>

        {/* Email */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={shareViaEmail}
          className="p-4 bg-slate-900/50 border border-slate-700 hover:border-slate-600 rounded-lg transition-all"
        >
          <div className="flex flex-col items-center space-y-2">
            <EnvelopeIcon className="w-6 h-6 text-slate-400" />
            <span className="text-white text-sm font-medium">E-Mail</span>
          </div>
        </motion.button>

        {/* WhatsApp */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={shareViaWhatsApp}
          className="p-4 bg-slate-900/50 border border-slate-700 hover:border-green-600 rounded-lg transition-all group"
        >
          <div className="flex flex-col items-center space-y-2">
            <div className="text-2xl">💬</div>
            <span className="text-white text-sm font-medium">WhatsApp</span>
          </div>
        </motion.button>

        {/* Telegram */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={shareViaTelegram}
          className="p-4 bg-slate-900/50 border border-slate-700 hover:border-blue-600 rounded-lg transition-all"
        >
          <div className="flex flex-col items-center space-y-2">
            <div className="text-2xl">✈️</div>
            <span className="text-white text-sm font-medium">Telegram</span>
          </div>
        </motion.button>

        {/* Native Share (Mobile) */}
        {typeof window !== 'undefined' && 'share' in navigator && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={nativeShare}
            className="p-4 bg-slate-900/50 border border-slate-700 hover:border-slate-600 rounded-lg transition-all col-span-2 sm:col-span-1"
          >
            <div className="flex flex-col items-center space-y-2">
              <ShareIcon className="w-6 h-6 text-slate-400" />
              <span className="text-white text-sm font-medium">Mehr...</span>
            </div>
          </motion.button>
        )}
      </div>
    </div>
  );
}

