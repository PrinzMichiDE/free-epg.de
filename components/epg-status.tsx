'use client';

import { motion } from 'framer-motion';
import { CheckCircleIcon, ClockIcon, ServerIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';

interface EpgStatusData {
  cache: {
    active: boolean;
    ageFormatted: string | null;
    revalidateSeconds: number;
  };
  sources: Array<{
    name: string;
    url: string;
    type: string;
  }>;
}

export function EpgStatus() {
  const [status, setStatus] = useState<EpgStatusData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const response = await fetch('/api/epg/status');
        const data = await response.json();
        setStatus(data);
      } catch (error) {
        console.error('Fehler beim Laden des Status:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStatus();
    const interval = setInterval(loadStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !status) {
    return (
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
        <div className="animate-pulse space-y-6">
          <div className="h-7 bg-white/10 rounded-lg w-1/3"></div>
          <div className="h-32 bg-white/10 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden hover:border-white/20 transition-all duration-300"
    >
      <TabGroup>
        <TabList className="flex border-b border-white/10 bg-white/5">
          <Tab className="flex-1 px-6 py-4 text-sm font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200 data-[selected]:text-white data-[selected]:bg-white/10 data-[selected]:border-b-2 data-[selected]:border-emerald-400">
            Cache Status
          </Tab>
          <Tab className="flex-1 px-6 py-4 text-sm font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200 data-[selected]:text-white data-[selected]:bg-white/10 data-[selected]:border-b-2 data-[selected]:border-emerald-400">
            Quellen
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel className="p-8">
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start space-x-4"
              >
                {status.cache.active ? (
                  <>
                    <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
                      <CheckCircleIcon className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-bold text-lg mb-1">Cache aktiv</p>
                      <p className="text-sm text-slate-400">
                        Alter: <span className="text-emerald-400 font-medium">{status.cache.ageFormatted}</span>
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/30">
                      <ClockIcon className="w-6 h-6 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-bold text-lg mb-1">Cache leer</p>
                      <p className="text-sm text-slate-400">
                        Wird beim nächsten Request geladen
                      </p>
                    </div>
                  </>
                )}
              </motion.div>

              <div className="pt-6 border-t border-white/10">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-900/60 to-slate-800/40 rounded-xl border border-white/5">
                  <div className="flex items-center space-x-3">
                    <ArrowPathIcon className="w-5 h-5 text-blue-400" />
                    <span className="text-sm font-medium text-slate-400">Revalidierung</span>
                  </div>
                  <span className="text-white font-bold text-base">
                    {Math.floor(status.cache.revalidateSeconds / 3600)} Stunden
                  </span>
                </div>
              </div>
            </div>
          </TabPanel>

          <TabPanel className="p-8">
            <div className="space-y-3">
              {status.sources.map((source, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="group flex items-start space-x-4 p-4 bg-gradient-to-r from-slate-900/60 to-slate-800/40 border border-white/5 rounded-xl hover:border-blue-500/30 hover:from-slate-900/80 hover:to-slate-800/60 transition-all duration-300"
                >
                  <div className="p-2.5 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors border border-blue-500/20">
                    <ServerIcon className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-base mb-1">{source.name}</p>
                    <p className="text-xs text-slate-400 truncate mb-2 font-mono">{source.url}</p>
                    <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold bg-slate-700/50 text-slate-300 rounded-md border border-white/5">
                      {source.type.toUpperCase()}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </motion.div>
  );
}

