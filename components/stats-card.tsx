'use client';

import { motion } from 'framer-motion';
import { ArrowTrendingUpIcon, ArrowDownTrayIcon, ChartBarIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { useTranslations } from '@/hooks/use-translations';

interface StatsData {
  visitors: number;
  downloads: number;
  dailyUsage: Array<{ date: string; downloads: number; uniqueIPs: number }>;
  topPlayers: Array<{ name: string; count: number }>;
  totalPlayers: number;
}

export function StatsCard() {
  const { t } = useTranslations();
  const [stats, setStats] = useState<StatsData>({
    visitors: 0,
    downloads: 0,
    dailyUsage: [],
    topPlayers: [],
    totalPlayers: 0,
  });
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
            dailyUsage: data.stats.dailyUsage || [],
            topPlayers: data.stats.topPlayers || [],
            totalPlayers: data.stats.totalPlayers || 0,
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

  // Berechne Gesamt-Downloads der letzten 7 Tage
  const totalWeeklyDownloads = stats.dailyUsage.reduce((sum, day) => sum + day.downloads, 0);
  const todayDownloads = stats.dailyUsage[stats.dailyUsage.length - 1]?.downloads || 0;

  return (
    <div className="space-y-6">
      {/* Hauptstatistiken */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <motion.div
          variants={itemVariants}
          className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl hover:border-blue-500/30 hover:bg-white/7 transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-300 font-semibold uppercase tracking-wider mb-2">{t('visitors')}</p>
              <p className="text-4xl font-bold text-white">
                {loading ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  stats.visitors.toLocaleString('de-DE')
                )}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl border border-blue-500/30 group-hover:scale-110 transition-transform duration-300">
              <ArrowTrendingUpIcon className="w-8 h-8 text-blue-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl hover:border-emerald-500/30 hover:bg-white/7 transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-300 font-semibold uppercase tracking-wider mb-2">{t('downloads')}</p>
              <p className="text-4xl font-bold text-white">
                {loading ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  stats.downloads.toLocaleString('de-DE')
                )}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl border border-emerald-500/30 group-hover:scale-110 transition-transform duration-300">
              <ArrowDownTrayIcon className="w-8 h-8 text-emerald-400" />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Tägliche Nutzung */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/30">
            <ChartBarIcon className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{t('dailyUsage')}</h3>
            <p className="text-sm text-slate-400">{t('dailyUsageDesc')}</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Heute */}
          <div className="bg-gradient-to-r from-slate-900/60 to-slate-800/40 border border-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-white">{t('today')}</span>
              <span className="text-lg font-bold text-emerald-400">
                {loading ? '...' : todayDownloads.toLocaleString('de-DE')}
              </span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: loading ? 0 : `${Math.min((todayDownloads / Math.max(totalWeeklyDownloads / 7, 1)) * 100, 100)}%` }}
                transition={{ duration: 1 }}
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
              />
            </div>
          </div>

          {/* Letzte 7 Tage */}
          <div className="grid grid-cols-7 gap-2">
            {stats.dailyUsage.map((day, idx) => {
              const date = new Date(day.date);
              const dayName = date.toLocaleDateString('de-DE', { weekday: 'short' });
              const maxDownloads = Math.max(...stats.dailyUsage.map(d => d.downloads), 1);
              
              return (
                <motion.div
                  key={day.date}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + idx * 0.05 }}
                  className="text-center"
                >
                  <div className="text-xs text-slate-400 mb-2">{dayName}</div>
                  <div className="bg-gradient-to-r from-slate-900/60 to-slate-800/40 border border-white/5 rounded-lg p-3 h-24 flex flex-col justify-between">
                    <div className="text-lg font-bold text-white">
                      {loading ? '...' : day.downloads.toLocaleString('de-DE')}
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(day.downloads / maxDownloads) * 100}%` }}
                        transition={{ duration: 0.5, delay: 0.4 + idx * 0.05 }}
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Player-Statistiken */}
      {stats.topPlayers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-orange-500/10 rounded-xl border border-orange-500/30">
              <DevicePhoneMobileIcon className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{t('playerStats')}</h3>
              <p className="text-sm text-slate-400">{t('playerStatsDesc')}</p>
            </div>
          </div>

          <div className="space-y-3">
            {stats.topPlayers.slice(0, 5).map((player, idx) => {
              const totalPlayerDownloads = stats.topPlayers.reduce((sum, p) => sum + p.count, 0);
              const percentage = (player.count / totalPlayerDownloads) * 100;
              
              return (
                <motion.div
                  key={player.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + idx * 0.1 }}
                  className="bg-gradient-to-r from-slate-900/60 to-slate-800/40 border border-white/5 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-white">{player.name}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-400">{percentage.toFixed(1)}%</span>
                      <span className="text-sm font-bold text-orange-400">
                        {player.count.toLocaleString('de-DE')}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, delay: 0.6 + idx * 0.1 }}
                      className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}

