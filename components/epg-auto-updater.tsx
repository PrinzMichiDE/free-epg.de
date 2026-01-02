'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

/**
 * Komponente die automatisch prüft ob EPG-Daten aktualisiert werden müssen
 * und das Update im Hintergrund triggert
 */
export function EpgAutoUpdater() {
  const [updateStatus, setUpdateStatus] = useState<{
    checking: boolean;
    updating: boolean;
    message: string;
  }>({
    checking: false,
    updating: false,
    message: '',
  });

  useEffect(() => {
    const checkAndUpdate = async () => {
      setUpdateStatus({ checking: true, updating: false, message: '' });

      try {
        const response = await fetch('/api/epg/check-update', {
          method: 'POST',
        });

        const data = await response.json();

        if (data.success && data.needsUpdate) {
          setUpdateStatus({
            checking: false,
            updating: true,
            message: 'EPG-Daten werden aktualisiert...',
          });

          // Nach 5 Sekunden die Meldung ausblenden
          setTimeout(() => {
            setUpdateStatus({
              checking: false,
              updating: false,
              message: '',
            });
          }, 5000);
        } else {
          setUpdateStatus({
            checking: false,
            updating: false,
            message: '',
          });
        }
      } catch (error) {
        console.error('Fehler beim Update-Check:', error);
        setUpdateStatus({
          checking: false,
          updating: false,
          message: '',
        });
      }
    };

    // Initiale Prüfung beim Seitenaufruf
    checkAndUpdate();

    // Regelmäßige Prüfung alle 5 Minuten
    const interval = setInterval(checkAndUpdate, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence>
      {(updateStatus.checking || updateStatus.updating) && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed top-6 right-6 z-50"
        >
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl px-5 py-3.5 flex items-center space-x-3.5 hover:border-white/30 transition-all duration-200">
            <div className={`p-1.5 rounded-lg ${updateStatus.updating ? 'bg-blue-500/20' : 'bg-slate-500/20'}`}>
              <ArrowPathIcon
                className={`w-4 h-4 text-white ${
                  updateStatus.updating ? 'animate-spin' : ''
                }`}
              />
            </div>
            <span className="text-white font-semibold text-sm">
              {updateStatus.checking
                ? 'Prüfe EPG-Status...'
                : updateStatus.message}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

