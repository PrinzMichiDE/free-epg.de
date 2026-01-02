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
import { CountrySelector } from './country-selector';
import { useTranslations } from '@/hooks/use-translations';
import { trackEpgDownload } from '@/lib/analytics';

export function IptvLinkCard() {
  const { t } = useTranslations();
  const [copied, setCopied] = useState(false);
  const [epgUrl, setEpgUrl] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('DE');

  useEffect(() => {
    // URL dynamisch erstellen (client-side) mit Länder-Parameter
    if (typeof window !== 'undefined') {
      setEpgUrl(`${window.location.origin}/api/epg?country=${selectedCountry}`);
    }
  }, [selectedCountry]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(epgUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      
      // Track EPG URL Copy Event
      trackEpgDownload(selectedCountry, navigator.userAgent);
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
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-blue-500/10 to-purple-500/10 rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent animate-pulse rounded-2xl"></div>
      </div>

      {/* Main Card */}
      <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl hover:border-emerald-500/30 transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-gradient-to-br from-emerald-500/20 to-blue-600/20 border border-emerald-500/30 rounded-xl shadow-lg">
              <TvIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{t('iptvCardTitle')}</h2>
              <p className="text-sm text-slate-400 mt-1">{t('iptvCardSubtitle')}</p>
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
            className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/30"
          >
            <LinkIcon className="w-6 h-6 text-emerald-400" />
          </motion.div>
        </div>

        {/* Country Selector */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-white mb-3">
            {t('selectCountry')}
          </label>
          <CountrySelector
            selectedCountry={selectedCountry}
            onCountryChange={setSelectedCountry}
          />
        </div>

        {/* URL Display */}
        <div className="bg-gradient-to-br from-slate-900/60 to-slate-800/40 border border-white/10 rounded-xl p-6 mb-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              {t('programUrl')}
            </span>
            <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs text-emerald-400 font-semibold">Live</span>
            </div>
          </div>
          
          <div className="bg-slate-950/60 rounded-lg p-4 mb-5 border border-white/5">
            <code className="text-emerald-300 font-mono text-sm md:text-base break-all leading-relaxed">
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
                  <span className="text-lg">{t('urlCopied')}</span>
                </>
              ) : (
                <>
                  <DocumentDuplicateIcon className="w-6 h-6" />
                  <span className="text-lg">{t('copyUrl')}</span>
                </>
              )}
            </div>
          </motion.button>
        </div>

        {/* Instructions */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-white flex items-center">
            <QrCodeIcon className="w-5 h-5 mr-2 text-emerald-400" />
            {t('howToUse')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-slate-900/60 to-slate-800/40 border border-white/5 rounded-xl p-5 hover:border-emerald-500/30 transition-all duration-300">
              <div className="text-emerald-400 font-bold text-2xl mb-2">1</div>
              <p className="text-white text-sm font-medium mb-1">
                {t('step1')}
              </p>
              <p className="text-slate-400 text-xs">
                {t('step1Desc')}
              </p>
            </div>
            <div className="bg-gradient-to-br from-slate-900/60 to-slate-800/40 border border-white/5 rounded-xl p-5 hover:border-blue-500/30 transition-all duration-300">
              <div className="text-blue-400 font-bold text-2xl mb-2">2</div>
              <p className="text-white text-sm font-medium mb-1">
                {t('step2')}
              </p>
              <p className="text-slate-400 text-xs">
                {t('step2Desc')}
              </p>
            </div>
            <div className="bg-gradient-to-br from-slate-900/60 to-slate-800/40 border border-white/5 rounded-xl p-5 hover:border-purple-500/30 transition-all duration-300">
              <div className="text-purple-400 font-bold text-2xl mb-2">3</div>
              <p className="text-white text-sm font-medium mb-1">
                {t('step3')}
              </p>
              <p className="text-slate-400 text-xs">
                {t('step3Desc')}
              </p>
            </div>
          </div>
        </div>

        {/* Compatible Apps Info */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <p className="text-sm text-slate-400 text-center font-medium">
            {t('compatibleApps')}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

