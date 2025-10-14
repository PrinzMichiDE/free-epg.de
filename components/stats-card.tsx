'use client';

import { motion } from 'framer-motion';
import { ArrowTrendingUpIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

interface StatsData {
  visitors: number;
  downloads: number;
}

export function StatsCard() {
  const [stats, setStats] = useState<StatsData>({ visitors: 0, downloads: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Besucher-Counter inkrementieren
    fetch('/api/stats/visitor', { method: 'POST' }).catch(console.error);

    // Statistiken laden
    const loadStats = async () => {
      try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        if (data.success) {
          setStats({
            visitors: data.stats.visitors,
            downloads: data.stats.downloads,
          });
        }
      } catch (error) {
        console.error('Fehler beim Laden der Statistiken:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();

    // Auto-Refresh alle 30 Sekunden
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      <motion.div
        variants={itemVariants}
        className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-6 backdrop-blur-sm"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-300 font-medium mb-1">Besucher</p>
            <p className="text-3xl font-bold text-white">
              {loading ? (
                <span className="animate-pulse">...</span>
              ) : (
                stats.visitors.toLocaleString('de-DE')
              )}
            </p>
          </div>
          <div className="p-3 bg-blue-500/20 rounded-lg">
            <ArrowTrendingUpIcon className="w-8 h-8 text-blue-400" />
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-xl p-6 backdrop-blur-sm"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-emerald-300 font-medium mb-1">Downloads</p>
            <p className="text-3xl font-bold text-white">
              {loading ? (
                <span className="animate-pulse">...</span>
              ) : (
                stats.downloads.toLocaleString('de-DE')
              )}
            </p>
          </div>
          <div className="p-3 bg-emerald-500/20 rounded-lg">
            <ArrowDownTrayIcon className="w-8 h-8 text-emerald-400" />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

