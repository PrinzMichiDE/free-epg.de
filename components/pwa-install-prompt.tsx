'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDownTrayIcon, XMarkIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Prüfe ob bereits installiert
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Registriere Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker registriert:', registration);
        })
        .catch((error) => {
          console.error('[PWA] Service Worker Fehler:', error);
        });
    }

    // Höre auf beforeinstallprompt Event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Zeige Prompt nach 3 Sekunden
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Zeige Install-Prompt
    deferredPrompt.prompt();

    // Warte auf User-Entscheidung
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] User ${outcome === 'accepted' ? 'akzeptiert' : 'abgelehnt'}`);

    // Cleanup
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Zeige erneut nach 24 Stunden
    localStorage.setItem('pwa-dismissed', Date.now().toString());
  };

  // Zeige nichts wenn bereits installiert
  if (isInstalled) return null;

  return (
    <AnimatePresence>
      {showPrompt && deferredPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50"
        >
          <div className="bg-gradient-to-br from-emerald-500/90 to-blue-600/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-6">
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-white" />
            </button>

            <div className="flex items-start space-x-4">
              <div className="p-3 bg-white/20 rounded-xl flex-shrink-0">
                <DevicePhoneMobileIcon className="w-8 h-8 text-white" />
              </div>
              
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg mb-1">
                  Als App installieren
                </h3>
                <p className="text-white/90 text-sm mb-4">
                  Installiere EPG Service auf deinem Gerät für schnelleren Zugriff und Offline-Nutzung!
                </p>
                
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleInstallClick}
                    className="flex-1 px-4 py-2.5 bg-white text-emerald-600 rounded-xl font-semibold shadow-lg flex items-center justify-center space-x-2"
                  >
                    <ArrowDownTrayIcon className="w-5 h-5" />
                    <span>Installieren</span>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDismiss}
                    className="px-4 py-2.5 bg-white/20 text-white rounded-xl font-medium"
                  >
                    Später
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

