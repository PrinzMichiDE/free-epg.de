'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DocumentArrowDownIcon,
  DocumentTextIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

export function M3uGenerator() {
  const [epgUrl, setEpgUrl] = useState('');
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setEpgUrl(`${window.location.origin}/api/epg`);
      setPlaylistUrl('https://iptv-org.github.io/iptv/languages/deu.m3u');
    }
  }, []);

  const generateM3U = () => {
    const m3uContent = `#EXTM3U url-tvg="${epgUrl}" refresh="3600"
#EXTINF:-1 tvg-id="" tvg-name="EPG Service" tvg-logo="" group-title="Info",EPG Service Info
${epgUrl}

# Füge hier deine eigenen Kanäle hinzu oder verwende eine bestehende M3U-Datei
# Beispiel:
# #EXTINF:-1 tvg-id="Das Erste.de" tvg-name="Das Erste" tvg-logo="https://..." group-title="Deutschland",Das Erste
# http://dein-stream-url.m3u8

# EPG wird automatisch von ${epgUrl} geladen
# Stelle sicher, dass die tvg-id mit den Channel-IDs im EPG übereinstimmen
`;

    const blob = new Blob([m3uContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'playlist-with-epg.m3u';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    setGenerated(true);
    setTimeout(() => setGenerated(false), 3000);
  };

  const generateXMLTV = () => {
    const xmltvContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE tv SYSTEM "xmltv.dtd">
<!-- 
  XMLTV-Konfiguration für EPG Service
  
  Verwende diese URL in deiner IPTV-App:
  ${epgUrl}
  
  Aktualisierungsintervall: 24 Stunden
  Format: XMLTV
  Encoding: UTF-8
  
  Kompatibel mit:
  - TiviMate
  - IPTV Smarters Pro
  - Perfect Player
  - Kodi (PVR IPTV Simple Client)
  - VLC
  - und allen anderen XMLTV-kompatiblen Playern
-->
<tv>
  <!-- EPG-Daten werden automatisch von ${epgUrl} geladen -->
  <!-- Keine manuelle Konfiguration erforderlich -->
</tv>
`;

    const blob = new Blob([xmltvContent], { type: 'application/xml' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'epg-config.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    setGenerated(true);
    setTimeout(() => setGenerated(false), 3000);
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 backdrop-blur-sm">
      <div className="flex items-center space-x-3 mb-4">
        <DocumentTextIcon className="w-6 h-6 text-indigo-400" />
        <h3 className="text-xl font-semibold text-white">Playlist Generator</h3>
      </div>

      <p className="text-slate-400 text-sm mb-6">
        Erstelle vorkonfigurierte Dateien mit der EPG-URL für deine IPTV-App
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* M3U Generator */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-slate-900/50 border border-slate-700 rounded-lg p-4"
        >
          <div className="flex items-start space-x-3 mb-4">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <DocumentArrowDownIcon className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-white font-medium mb-1">M3U Playlist</h4>
              <p className="text-slate-400 text-xs">
                Mit EPG-URL vorkonfiguriert
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={generateM3U}
            className="w-full px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium text-sm transition-colors"
          >
            M3U erstellen
          </motion.button>
        </motion.div>

        {/* XMLTV Config */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-slate-900/50 border border-slate-700 rounded-lg p-4"
        >
          <div className="flex items-start space-x-3 mb-4">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <DocumentTextIcon className="w-5 h-5 text-purple-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-white font-medium mb-1">XMLTV Config</h4>
              <p className="text-slate-400 text-xs">
                Konfigurationsdatei für Kodi & Co.
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={generateXMLTV}
            className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium text-sm transition-colors"
          >
            XML Config erstellen
          </motion.button>
        </motion.div>
      </div>

      {/* Success Message */}
      {generated && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex items-center space-x-2 text-emerald-400 text-sm"
        >
          <CheckCircleIcon className="w-5 h-5" />
          <span>Datei wurde heruntergeladen!</span>
        </motion.div>
      )}

      {/* Info */}
      <div className="mt-6 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <p className="text-blue-300 text-xs leading-relaxed">
          <strong>Tipp:</strong> Die M3U-Datei enthält bereits die EPG-URL. Füge einfach deine Stream-URLs hinzu und importiere sie in deine IPTV-App!
        </p>
      </div>
    </div>
  );
}

