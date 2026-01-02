'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TvIcon,
  ClockIcon,
  FilmIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { useTranslations } from '@/hooks/use-translations';
import { CountrySelector } from './country-selector';

interface Programme {
  title: string;
  description: string;
  category: string;
  start: string;
  startFormatted: string;
  startTime: string;
}

interface Channel {
  id: string;
  name: string;
  icon: string | null;
  programmes: Programme[];
}

interface EpgPreviewData {
  success: boolean;
  country: string;
  totalChannels: number;
  totalProgrammes: number;
  previewChannels: number;
  channels: Channel[];
  generatedAt: string;
}

export function EpgProgramPreview() {
  const { t, locale } = useTranslations();
  const [data, setData] = useState<EpgPreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState('DE');
  const [expandedChannel, setExpandedChannel] = useState<string | null>(null);

  useEffect(() => {
    const loadPreview = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/epg/preview?country=${selectedCountry}&limit=5`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
          setData(result);
        } else {
          setError(result.message || 'Fehler beim Laden der Daten');
        }
      } catch (error) {
        console.error('Fehler beim Laden der EPG-Preview:', error);
        setError(error instanceof Error ? error.message : 'Unbekannter Fehler');
      } finally {
        setLoading(false);
      }
    };

    loadPreview();
    const interval = setInterval(loadPreview, 60000); // Refresh alle Minute
    return () => clearInterval(interval);
  }, [selectedCountry]);

  if (loading && !data) {
    return (
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
        <div className="animate-pulse space-y-6">
          <div className="h-7 bg-white/10 rounded-lg w-1/3"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-white/10 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8 shadow-2xl"
      >
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-red-500/20 rounded-xl border border-red-500/30">
            <FilmIcon className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-1">EPG Programm-Vorschau</h3>
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                const loadPreview = async () => {
                  try {
                    const response = await fetch(`/api/epg/preview?country=${selectedCountry}&limit=5`);
                    const result = await response.json();
                    if (result.success) {
                      setData(result);
                    }
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
                  } finally {
                    setLoading(false);
                  }
                };
                loadPreview();
              }}
              className="mt-3 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-white text-sm transition-colors"
            >
              Erneut versuchen
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!data || !data.success) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl hover:border-white/20 transition-all duration-300"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-8 gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30 shadow-lg">
            <FilmIcon className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white tracking-tight">EPG Programm-Vorschau</h3>
            <p className="text-slate-400 text-sm mt-1">
              {data.totalChannels.toLocaleString('de-DE')} Kanäle • {data.totalProgrammes.toLocaleString('de-DE')} Programme
            </p>
          </div>
        </div>
        <div className="md:w-64">
          <label className="block text-sm font-semibold text-white mb-2">
            Land auswählen
          </label>
          <CountrySelector
            selectedCountry={selectedCountry}
            onCountryChange={setSelectedCountry}
          />
        </div>
      </div>

      {/* Channels List */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {data.channels.slice(0, 10).map((channel, idx) => (
          <motion.div
            key={channel.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-gradient-to-r from-slate-900/60 to-slate-800/40 border border-white/5 rounded-xl overflow-hidden hover:border-purple-500/30 transition-all duration-300"
          >
            {/* Channel Header */}
            <button
              onClick={() => setExpandedChannel(expandedChannel === channel.id ? null : channel.id)}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                {channel.icon && (
                  <img
                    src={channel.icon}
                    alt={channel.name}
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-semibold text-base truncate">{channel.name}</h4>
                  <p className="text-slate-400 text-xs mt-0.5">
                    {channel.programmes.length} {channel.programmes.length === 1 ? 'Programm' : 'Programme'}
                  </p>
                </div>
              </div>
              <ChevronRightIcon
                className={`w-5 h-5 text-slate-400 transition-transform ${
                  expandedChannel === channel.id ? 'rotate-90' : ''
                }`}
              />
            </button>

            {/* Programmes List */}
            {expandedChannel === channel.id && (
              <div className="border-t border-white/5 px-5 py-4 space-y-3">
                {channel.programmes.map((programme, pIdx) => (
                  <motion.div
                    key={`${channel.id}-${programme.start}-${pIdx}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: pIdx * 0.05 }}
                    className="bg-slate-900/40 rounded-lg p-4 border border-white/5"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h5 className="text-white font-semibold text-sm mb-1">{programme.title}</h5>
                        {programme.category && (
                          <span className="inline-block px-2 py-0.5 bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs rounded mb-2">
                            {programme.category}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                        <ClockIcon className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-300 text-xs font-medium">{programme.startTime}</span>
                      </div>
                    </div>
                    {programme.description && (
                      <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">
                        {programme.description}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <p className="text-xs text-slate-400 text-center">
          Zeigt {data.previewChannels} von {data.totalChannels} Kanälen • 
          Generiert: {new Date(data.generatedAt).toLocaleString('de-DE')}
        </p>
      </div>
    </motion.div>
  );
}
