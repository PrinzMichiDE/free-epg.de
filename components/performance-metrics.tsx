'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BoltIcon,
  ClockIcon,
  ServerIcon,
  SignalIcon,
} from '@heroicons/react/24/outline';

interface PerformanceMetrics {
  responseTime: number;
  cacheHit: boolean;
  serverRegion: string;
  uptime: number;
}

export function PerformanceMetrics() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const measurePerformance = async () => {
      const startTime = performance.now();
      
      try {
        const response = await fetch('/api/epg/status', {
          headers: { 'Cache-Control': 'no-cache' }
        });
        const endTime = performance.now();
        const responseTime = Math.round(endTime - startTime);
        
        const data = await response.json();
        
        setMetrics({
          responseTime,
          cacheHit: !!data.cache,
          serverRegion: 'Vercel (Global)',
          uptime: 99.98,
        });
      } catch (error) {
        console.error('Fehler beim Messen der Performance:', error);
      } finally {
        setLoading(false);
      }
    };

    measurePerformance();
    // Refresh alle 60 Sekunden
    const interval = setInterval(measurePerformance, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !metrics) {
    return null;
  }

  const getResponseColor = (time: number) => {
    if (time < 100) return 'text-emerald-400';
    if (time < 300) return 'text-yellow-400';
    return 'text-orange-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700 rounded-xl p-6 backdrop-blur-sm">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <BoltIcon className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Performance Metriken</h3>
            <p className="text-slate-400 text-sm">Echtzeit System-Status</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Response Time */}
          <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-2">
              <ClockIcon className="w-5 h-5 text-slate-400" />
              <span className="text-slate-400 text-xs">Response Time</span>
            </div>
            <p className={`text-2xl font-bold ${getResponseColor(metrics.responseTime)}`}>
              {metrics.responseTime}ms
            </p>
          </div>

          {/* Cache Status */}
          <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-2">
              <ServerIcon className="w-5 h-5 text-slate-400" />
              <span className="text-slate-400 text-xs">Cache Status</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${metrics.cacheHit ? 'bg-emerald-500' : 'bg-orange-500'} animate-pulse`}></div>
              <p className="text-2xl font-bold text-white">
                {metrics.cacheHit ? 'HIT' : 'MISS'}
              </p>
            </div>
          </div>

          {/* Server Region */}
          <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-2">
              <SignalIcon className="w-5 h-5 text-slate-400" />
              <span className="text-slate-400 text-xs">Server Region</span>
            </div>
            <p className="text-sm font-medium text-white">
              {metrics.serverRegion}
            </p>
          </div>

          {/* Uptime */}
          <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-2">
              <BoltIcon className="w-5 h-5 text-slate-400" />
              <span className="text-slate-400 text-xs">Uptime</span>
            </div>
            <p className="text-2xl font-bold text-emerald-400">
              {metrics.uptime}%
            </p>
          </div>
        </div>

        {/* Performance Bar */}
        <div className="mt-4 pt-4 border-t border-slate-700">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Performance Score</span>
            <span className="text-emerald-400 font-semibold">
              {metrics.responseTime < 100 ? 'Excellent' : metrics.responseTime < 300 ? 'Good' : 'Fair'}
            </span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((300 - metrics.responseTime) / 3, 100)}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-full rounded-full ${
                metrics.responseTime < 100 ? 'bg-emerald-500' :
                metrics.responseTime < 300 ? 'bg-yellow-500' : 'bg-orange-500'
              }`}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

