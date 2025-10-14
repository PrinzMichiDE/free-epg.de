'use client';

import { motion } from 'framer-motion';
import { CheckCircleIcon, ClockIcon, ServerIcon } from '@heroicons/react/24/outline';
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
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 backdrop-blur-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-700 rounded w-1/3"></div>
          <div className="h-20 bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-slate-800/50 border border-slate-700 rounded-xl backdrop-blur-sm overflow-hidden"
    >
      <TabGroup>
        <TabList className="flex border-b border-slate-700 bg-slate-800/80">
          <Tab className="flex-1 px-4 py-3 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors data-[selected]:text-white data-[selected]:bg-slate-700/70 data-[selected]:border-b-2 data-[selected]:border-emerald-500">
            Cache Status
          </Tab>
          <Tab className="flex-1 px-4 py-3 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors data-[selected]:text-white data-[selected]:bg-slate-700/70 data-[selected]:border-b-2 data-[selected]:border-emerald-500">
            Quellen
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                {status.cache.active ? (
                  <>
                    <CheckCircleIcon className="w-6 h-6 text-emerald-400" />
                    <div>
                      <p className="text-white font-medium">Cache aktiv</p>
                      <p className="text-sm text-slate-400">
                        Alter: {status.cache.ageFormatted}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <ClockIcon className="w-6 h-6 text-amber-400" />
                    <div>
                      <p className="text-white font-medium">Cache leer</p>
                      <p className="text-sm text-slate-400">
                        Wird beim nächsten Request geladen
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="pt-4 border-t border-slate-700">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Revalidierung</span>
                  <span className="text-white font-medium">
                    {Math.floor(status.cache.revalidateSeconds / 3600)} Stunden
                  </span>
                </div>
              </div>
            </div>
          </TabPanel>

          <TabPanel className="p-6">
            <div className="space-y-3">
              {status.sources.map((source, idx) => (
                <div
                  key={idx}
                  className="flex items-start space-x-3 p-3 bg-slate-700/30 rounded-lg"
                >
                  <ServerIcon className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm">{source.name}</p>
                    <p className="text-xs text-slate-400 truncate mt-1">{source.url}</p>
                    <span className="inline-block mt-2 px-2 py-0.5 text-xs bg-slate-600 text-slate-300 rounded">
                      {source.type.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </motion.div>
  );
}

