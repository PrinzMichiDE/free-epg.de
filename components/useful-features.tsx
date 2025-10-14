'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  QrCodeIcon,
  ArrowDownTrayIcon,
  ClockIcon,
  DevicePhoneMobileIcon,
  CheckCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import QRCode from 'qrcode';

import { M3uGenerator } from './m3u-generator';
import { ShareButtons } from './share-buttons';

export function UsefulFeatures() {
  const [epgUrl, setEpgUrl] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [showQr, setShowQr] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [downloading, setDownloading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // EPG URL setzen
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/api/epg`;
      setEpgUrl(url);
    }

    // Letzte Aktualisierung laden
    fetch('/api/epg/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.cache && data.cache.ageFormatted) {
          setLastUpdate(data.cache.ageFormatted);
        }
      })
      .catch(console.error);
  }, []);

  // QR-Code generieren wenn angezeigt
  useEffect(() => {
    if (epgUrl && showQr && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        epgUrl,
        {
          width: 200,
          margin: 2,
          color: {
            dark: '#10b981',
            light: '#ffffff',
          },
        },
        (error) => {
          if (error) console.error('QR-Code Fehler:', error);
        }
      );

      // URL für Download generieren
      QRCode.toDataURL(epgUrl, { width: 400 })
        .then(setQrCodeUrl)
        .catch(console.error);
    }
  }, [epgUrl, showQr]);

  const handleDownloadXml = async () => {
    setDownloading(true);
    try {
      const response = await fetch('/api/epg');
      const xmlData = await response.text();
      const blob = new Blob([xmlData], { type: 'application/xml' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `epg-${new Date().toISOString().split('T')[0]}.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download-Fehler:', error);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadQr = () => {
    if (!qrCodeUrl) return;
    const a = document.createElement('a');
    a.href = qrCodeUrl;
    a.download = 'epg-qr-code.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const apps = [
    {
      name: 'TiviMate',
      icon: '📺',
      steps: [
        'Öffne TiviMate',
        'Gehe zu Einstellungen → EPG',
        'Füge die EPG-URL ein',
        'Speichern & Aktualisieren',
      ],
    },
    {
      name: 'IPTV Smarters Pro',
      icon: '🎬',
      steps: [
        'Öffne IPTV Smarters Pro',
        'Gehe zu Einstellungen',
        'EPG URL hinzufügen',
        'EPG aktualisieren',
      ],
    },
    {
      name: 'Perfect Player',
      icon: '▶️',
      steps: [
        'Öffne Perfect Player',
        'Einstellungen → EPG',
        'URL eintragen',
        'Update starten',
      ],
    },
  ];

  return (
    <div id="tools" className="mb-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold text-white mb-2">Nützliche Tools</h2>
        <p className="text-slate-400">
          Alles was du brauchst, um die EPG-Daten zu nutzen
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR-Code */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 backdrop-blur-sm"
        >
          <div className="flex items-center space-x-3 mb-4">
            <QrCodeIcon className="w-6 h-6 text-emerald-400" />
            <h3 className="text-xl font-semibold text-white">QR-Code</h3>
          </div>
          <p className="text-slate-400 text-sm mb-4">
            Scanne den QR-Code mit deinem Handy, um die EPG-URL schnell zu übertragen
          </p>

          <div className="flex flex-col items-center space-y-4">
            {showQr ? (
              <>
                <div className="bg-white p-4 rounded-lg">
                  <canvas ref={canvasRef} />
                </div>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDownloadQr}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium text-sm transition-colors"
                  >
                    QR-Code speichern
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowQr(false)}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium text-sm transition-colors"
                  >
                    Schließen
                  </motion.button>
                </div>
              </>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowQr(true)}
                className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-semibold shadow-lg shadow-emerald-500/50 transition-all"
              >
                QR-Code anzeigen
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Download & Info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 backdrop-blur-sm space-y-4"
        >
          {/* Download XML */}
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <ArrowDownTrayIcon className="w-6 h-6 text-blue-400" />
              <h3 className="text-xl font-semibold text-white">XML Download</h3>
            </div>
            <p className="text-slate-400 text-sm mb-3">
              Lade die EPG-Daten als XML-Datei herunter für lokale Nutzung
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDownloadXml}
              disabled={downloading}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold shadow-lg shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {downloading ? 'Wird heruntergeladen...' : 'EPG.xml herunterladen'}
            </motion.button>
          </div>

          {/* Letzte Aktualisierung */}
          <div className="pt-4 border-t border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ClockIcon className="w-5 h-5 text-purple-400" />
                <span className="text-slate-400 text-sm">Letzte Aktualisierung:</span>
              </div>
              <span className="text-white font-medium text-sm">
                {lastUpdate ? `vor ${lastUpdate}` : 'Lädt...'}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* M3U Generator & Share */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <M3uGenerator />
        <ShareButtons />
      </div>

      {/* Setup-Anleitungen */}
      <motion.div
        id="setup"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 backdrop-blur-sm"
      >
        <div className="flex items-center space-x-3 mb-6">
          <DevicePhoneMobileIcon className="w-6 h-6 text-orange-400" />
          <h3 className="text-xl font-semibold text-white">Setup-Anleitungen</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {apps.map((app, idx) => (
            <div
              key={idx}
              className="bg-slate-900/50 border border-slate-700 rounded-lg p-4"
            >
              <div className="text-3xl mb-3 text-center">{app.icon}</div>
              <h4 className="text-white font-semibold text-center mb-3">{app.name}</h4>
              <ol className="space-y-2">
                {app.steps.map((step, stepIdx) => (
                  <li key={stepIdx} className="flex items-start space-x-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center mt-0.5">
                      <span className="text-emerald-400 text-xs font-bold">
                        {stepIdx + 1}
                      </span>
                    </span>
                    <span className="text-slate-400 text-sm">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Wichtige Hinweise */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-6 backdrop-blur-sm"
      >
        <div className="flex items-start space-x-3">
          <InformationCircleIcon className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
          <div>
            <h4 className="text-white font-semibold mb-2">Wichtige Hinweise</h4>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li className="flex items-start space-x-2">
                <CheckCircleIcon className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Die EPG-Daten werden täglich automatisch aktualisiert</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircleIcon className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>
                  Verwende in deiner IPTV-App die Einstellung "Auto-Update" für beste Ergebnisse
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircleIcon className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Die EPG-URL ist kostenlos und erfordert keine Registrierung</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircleIcon className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Kompatibel mit allen gängigen IPTV-Playern und Apps</span>
              </li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

