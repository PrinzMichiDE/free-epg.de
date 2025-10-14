'use client';

import { motion } from 'framer-motion';
import { DocumentDuplicateIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

interface Endpoint {
  method: string;
  path: string;
  description: string;
  color: string;
}

const endpoints: Endpoint[] = [
  {
    method: 'GET',
    path: '/api/epg',
    description: 'Liefert die gemergten EPG Daten als XML',
    color: 'emerald',
  },
  {
    method: 'GET',
    path: '/api/epg/status',
    description: 'Zeigt Cache-Status und Quellen-Informationen',
    color: 'blue',
  },
  {
    method: 'POST',
    path: '/api/epg/refresh',
    description: 'Setzt den Cache zurück (erzwingt Neuladung)',
    color: 'amber',
  },
  {
    method: 'GET',
    path: '/api/stats',
    description: 'Gibt aktuelle Statistiken zurück',
    color: 'purple',
  },
];

function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}${endpoint.path}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Fehler beim Kopieren:', err);
    }
  };

  const colorClasses: Record<string, string> = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className={`bg-slate-800/50 border rounded-xl p-4 backdrop-blur-sm ${
        colorClasses[endpoint.color]
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <span
          className={`px-2 py-1 text-xs font-bold rounded uppercase ${
            endpoint.method === 'GET' ? 'bg-emerald-500/20' : 'bg-amber-500/20'
          }`}
        >
          {endpoint.method}
        </span>
        <button
          onClick={copyToClipboard}
          className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
          title="URL kopieren"
        >
          {copied ? (
            <CheckIcon className="w-4 h-4 text-emerald-400" />
          ) : (
            <DocumentDuplicateIcon className="w-4 h-4 text-slate-400" />
          )}
        </button>
      </div>
      <code className="block text-sm font-mono mb-2 text-white break-all">
        {endpoint.path}
      </code>
      <p className="text-xs text-slate-400">{endpoint.description}</p>
    </motion.div>
  );
}

export function ApiEndpoints() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="space-y-4"
    >
      <h2 className="text-xl font-semibold text-white mb-4">API Endpoints</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {endpoints.map((endpoint, idx) => (
          <motion.div
            key={endpoint.path}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * idx }}
          >
            <EndpointCard endpoint={endpoint} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

