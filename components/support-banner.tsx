'use client';

import { motion } from 'framer-motion';
import { GiftIcon, HeartIcon, CurrencyDollarIcon, CoffeeIcon } from '@heroicons/react/24/outline';

export function SupportBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4 }}
      className="relative overflow-hidden"
    >
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#FF5E5B]/10 via-pink-500/10 to-purple-500/10 animate-pulse rounded-2xl"></div>

      {/* Main Card */}
      <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl hover:border-[#FF5E5B]/30 transition-all duration-300">
        <div className="flex flex-col md:flex-row items-start space-y-4 md:space-y-0 md:space-x-6">
          <div className="p-4 bg-gradient-to-br from-[#FF5E5B]/20 to-[#FF6B68]/20 border border-[#FF5E5B]/30 rounded-xl">
            <HeartIcon className="w-8 h-8 text-[#FF5E5B]" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center">
              Unterstütze das Projekt
              <HeartIcon className="w-5 h-5 ml-2 text-[#FF5E5B] animate-pulse" />
            </h3>
            <p className="text-slate-300 text-sm mb-6">
              Gefällt dir dieser Service? Unterstütze die Entwicklung mit einer Spende!
            </p>
            <div className="flex flex-wrap gap-3">
              <motion.a
                href="https://ko-fi.com/michelfritzsch"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#FF5E5B] to-[#FF6B68] text-white font-bold rounded-xl hover:from-[#FF6B68] hover:to-[#FF7875] transition-all shadow-lg shadow-[#FF5E5B]/50"
              >
                <CoffeeIcon className="w-5 h-5 mr-2" />
                Ko-Fi unterstützen
              </motion.a>
              <motion.a
                href="http://paypal.me/michelfritzsch"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500/90 to-blue-600/90 border border-blue-500/30 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30"
              >
                <CurrencyDollarIcon className="w-5 h-5 mr-2" />
                PayPal
              </motion.a>
              <motion.a
                href="https://www.amazon.de/hz/wishlist/ls/2K3UPHK4UWCXP?type=wishlist&filter=all&sort=price-asc&viewType=list"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-500/90 to-purple-600/90 border border-pink-500/30 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all shadow-lg shadow-pink-500/30"
              >
                <GiftIcon className="w-5 h-5 mr-2" />
                Amazon Wunschzettel
              </motion.a>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
