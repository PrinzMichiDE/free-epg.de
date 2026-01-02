'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ClockIcon,
  TvIcon,
  ArrowPathIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface EpgPreview {
  channelCount: number;
  programCount: number;
  lastUpdate: string;
  nextUpdate: string;
  sources: string[];
}

export function EpgPreviewCard() {
  const [preview, setPreview] = useState<EpgPreview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPreview = async () => {
      try {
        const response = await fetch('/api/epg/status');
        const data = await response.json();
        
        if (data.cache) {
          const now = Date.now();
          const lastUpdateTime = now - (data.cache.age || 0);
          const nextUpdateTime = lastUpdateTime + (data.cache.revalidateSeconds * 1000);
          
          setPreview({
            channelCount: 0, // Would need to parse XML to get actual count
            programCount: 0,
            lastUpdate: new Date(lastUpdateTime).toLocaleString('de-DE'),
            nextUpdate: new Date(nextUpdateTime).toLocaleString('de-DE'),
            sources: data.sources?.map((s: any) => s.name) || [],
          });
        }
      } catch (error) {
        console.error('Fehler beim Laden der EPG-Preview:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPreview();
    // Auto-refresh alle 30 Sekunden
    const interval = setInterval(loadPreview, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !preview) {
    return (
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
        <div className="animate-pulse space-y-6">
          <div className="h-7 bg-white/10 rounded-lg w-1/3"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 bg-white/10 rounded-xl"></div>
            <div className="h-24 bg-white/10 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl hover:border-white/20 transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl border border-blue-500/30 shadow-lg">
            <TvIcon className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white tracking-tight">EPG Übersicht</h3>
            <p className="text-slate-400 text-sm mt-1">Aktuelle Programmdaten</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
          <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-medium text-emerald-400">Aktiv</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="group relative bg-gradient-to-br from-slate-900/60 to-slate-800/40 border border-white/5 rounded-xl p-5 hover:border-emerald-500/30 transition-all duration-300"
        >
          <div className="flex items-start space-x-4">
            <div className="p-2.5 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
              <ClockIcon className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Letzte Aktualisierung</p>
              <p className="text-white font-semibold text-base leading-tight">{preview.lastUpdate}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="group relative bg-gradient-to-br from-slate-900/60 to-slate-800/40 border border-white/5 rounded-xl p-5 hover:border-blue-500/30 transition-all duration-300"
        >
          <div className="flex items-start space-x-4">
            <div className="p-2.5 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
              <ArrowPathIcon className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Nächste Aktualisierung</p>
              <p className="text-white font-semibold text-base leading-tight">{preview.nextUpdate}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Sources */}
      {preview.sources.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="border-t border-white/10 pt-6"
        >
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Aktive Quellen</p>
          <div className="flex flex-wrap gap-2.5">
            {preview.sources.map((source, idx) => (
              <motion.span
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25 + idx * 0.05 }}
                className="inline-flex items-center px-3.5 py-1.5 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium rounded-lg backdrop-blur-sm hover:border-emerald-500/40 hover:from-emerald-500/20 hover:to-blue-500/20 transition-all duration-200"
              >
                {source}
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

