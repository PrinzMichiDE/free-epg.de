'use client';

import { motion } from 'framer-motion';
import { GiftIcon, HeartIcon } from '@heroicons/react/24/outline';

export function SupportBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4 }}
      className="relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-blue-500/20 animate-pulse"></div>
      <div className="relative bg-gradient-to-br from-pink-500/10 to-purple-600/10 border border-pink-500/30 rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-pink-500/20 rounded-xl">
            <GiftIcon className="w-8 h-8 text-pink-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
              Unterstütze das Projekt
              <HeartIcon className="w-5 h-5 ml-2 text-pink-400 animate-pulse" />
            </h3>
            <p className="text-slate-300 text-sm mb-4">
              Gefällt dir dieser Service? Unterstütze die Entwicklung mit einem kleinen Geschenk!
            </p>
            <motion.a
              href="https://www.amazon.de/hz/wishlist/ls/2K3UPHK4UWCXP?ref_=wl_share"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all shadow-lg shadow-pink-500/50"
            >
              <GiftIcon className="w-5 h-5 mr-2" />
              Amazon Wunschzettel öffnen
            </motion.a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

