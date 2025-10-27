'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ClockIcon,
  TvIcon,
  CalendarIcon,
  ArrowPathIcon,
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
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 backdrop-blur-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-700 rounded w-1/2"></div>
          <div className="h-20 bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700 rounded-xl p-6 backdrop-blur-sm"
    >
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <TvIcon className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white">EPG Übersicht</h3>
          <p className="text-slate-400 text-sm">Aktuelle Programmdaten</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <ClockIcon className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-slate-400 text-xs">Letzte Aktualisierung</p>
              <p className="text-white font-medium text-sm">{preview.lastUpdate}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <ArrowPathIcon className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-slate-400 text-xs">Nächste Aktualisierung</p>
              <p className="text-white font-medium text-sm">{preview.nextUpdate}</p>
            </div>
          </div>
        </div>
      </div>

      {preview.sources.length > 0 && (
        <div className="border-t border-slate-700 pt-4">
          <p className="text-slate-400 text-sm mb-2">Aktive Quellen:</p>
          <div className="flex flex-wrap gap-2">
            {preview.sources.map((source, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-full"
              >
                {source}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

