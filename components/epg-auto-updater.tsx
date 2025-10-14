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
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 right-4 z-50"
        >
          <div className="bg-gradient-to-r from-blue-500/90 to-purple-600/90 backdrop-blur-md border border-white/20 rounded-lg shadow-xl px-4 py-3 flex items-center space-x-3">
            <ArrowPathIcon
              className={`w-5 h-5 text-white ${
                updateStatus.updating ? 'animate-spin' : ''
              }`}
            />
            <span className="text-white font-medium text-sm">
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

